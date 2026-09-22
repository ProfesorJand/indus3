import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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
        throw new Error(`El servidor no devolvió un JSON válido. Respuesta del servidor (primeros 200 caracteres): ${text.slice(0, 200)}`);
      }
    } catch (error) {
      console.log(`Intento ${i + 1} falló: ${error.message}. Reintentando en 3s...`);
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

try {
  const json = await fetchWithRetry("https://api.indus3pro.com/biografias/get-biografias.php?t="+Date.now(), {
    headers: {
      "Authorization": `Bearer ${process.env.PUBLIC_BACKEND_AUTH_KEY}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      "Cache-Control": "max-age=0",
      "Sec-Ch-Ua": '"Chromium";v="122", "Google Chrome";v="122", "Not-A.Brand";v="99"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1"
    }
  });

  if (!json || !json.data) {
    console.error("Respuesta inválida:", json);
    process.exit(1); // 👈 corta el build con error claro
  }

  fs.writeFileSync("./src/data/biografias.json", JSON.stringify(json.data, null, 2));
  console.log(`✅ Biografías guardadas correctamente (${json.data.length} biografías).`);

} catch (error) {
  console.error("❌ Fallo crítico al hacer fetch de Biografias:", error.message || error);
  process.exit(1);
}