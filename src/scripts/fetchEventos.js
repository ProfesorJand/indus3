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

// Forzar IPv4 para evitar timeouts en GitHub Actions (Node 17+ usa IPv6 por defecto si hay registro AAAA)
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
  const authKey = process.env.BACKEND_AUTH_KEY || process.env.PUBLIC_BACKEND_AUTH_KEY;
  const json = await fetchWithRetry("https://api.indus3pro.com/eventos/get-eventos.php?t="+Date.now(), {
    headers: {
      "Authorization": `Bearer ${authKey}`,
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  if (!json || !json.data) {
    throw new Error("Respuesta inválida o sin datos: " + JSON.stringify(json));
  }

  fs.writeFileSync("./src/data/eventos.json", JSON.stringify(json.data, null, 2));
  console.log(`✅ Eventos guardados correctamente (${json.data.length} eventos).`);

} catch (error) {
  console.warn("⚠️ No se pudo actualizar eventos desde la API remota:", error.message || error);
  if (fs.existsSync("./src/data/eventos.json")) {
    console.log("ℹ️ Usando archivo de respaldo local existente (src/data/eventos.json). Continuando build...");
  } else {
    console.error("❌ Fallo crítico: no hay datos de eventos ni archivo de respaldo.");
    process.exit(1);
  }
}