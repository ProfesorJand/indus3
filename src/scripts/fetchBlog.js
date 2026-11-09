import fs from "fs";
import path from "path";
import dns from "dns";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
  });
}

// Forzar IPv4 para evitar timeouts en GitHub Actions
dns.setDefaultResultOrder("ipv4first");

async function fetchWithPlaywright(url, authKey) {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        extraHTTPHeaders: { 'Authorization': `Bearer ${authKey}` }
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const body = await page.textContent('body');
      const json = JSON.parse(body);
      return json;
    } finally {
      await browser.close();
    }
  } catch (err) {
    throw new Error("Playwright fallback falló: " + err.message);
  }
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} - ${text.slice(0, 150)}`);
      }

      try {
        const json = JSON.parse(text);
        return json;
      } catch (err) {
        throw new Error(`El servidor no devolvió un JSON válido. Respuesta: ${text.slice(0, 200)}`);
      }
    } catch (error) {
      console.log(`[fetchBlog] Intento ${i + 1} falló: ${error.message}. Reintentando en 3s...`);
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

try {
  const authKey = process.env.BACKEND_AUTH_KEY || process.env.PUBLIC_BACKEND_AUTH_KEY || '';
  const url = "https://api.indus3pro.com/blog/get_posts.php?t=" + Date.now();
  let json = null;

  try {
    json = await fetchWithRetry(url, {
      headers: {
        "Authorization": `Bearer ${authKey}`,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });
  } catch (fetchErr) {
    console.log("[fetchBlog] Petición directa bloqueada (" + fetchErr.message + "). Intentando con Playwright Chromium...");
    try {
      json = await fetchWithPlaywright(url, authKey);
    } catch (pwErr) {
      console.warn("⚠️ [fetchBlog] Playwright tampoco pudo conectar:", pwErr.message);
      throw fetchErr;
    }
  }

  if (!json || !Array.isArray(json.posts)) {
    throw new Error("Respuesta inválida o sin array de posts: " + JSON.stringify(json));
  }

  fs.writeFileSync("./src/data/blog.json", JSON.stringify(json.posts, null, 2));
  console.log(`✅ Artículos del Blog guardados correctamente desde GoDaddy (${json.posts.length} posts).`);

} catch (error) {
  console.warn("⚠️ No se pudo actualizar el Blog desde la API remota de GoDaddy:", error.message || error);
  if (fs.existsSync("./src/data/blog.json")) {
    console.log("ℹ️ Usando archivo de respaldo local existente (src/data/blog.json). Continuando build...");
  } else {
    console.error("❌ Fallo crítico: no hay datos del blog ni archivo de respaldo.");
    process.exit(1);
  }
}

