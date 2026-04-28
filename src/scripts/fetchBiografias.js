import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

// Forzar IPv4 para evitar timeouts en GitHub Actions
dns.setDefaultResultOrder("ipv4first");

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      return res;
    } catch (error) {
      console.log(`Intento ${i + 1} falló: ${error.message}. Reintentando...`);
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, 2000));
    }
  }
}

try {
  const res = await fetchWithRetry("https://api.indus3pro.com/biografias/get-biografias.php?t="+Date.now(), {
    headers: {
      Authorization: `Bearer ${process.env.PUBLIC_BACKEND_AUTH_KEY}`
    }
  });

  const text = await res.text();

let json;

try {
  json = JSON.parse(text);
} catch (e) {
  console.error("No es JSON válido");
  process.exit(1);
}

if (!json || !json.data) {
  console.error("Respuesta inválida:", json);
  process.exit(1); // 👈 corta el build con error claro
}

fs.writeFileSync("./src/data/biografias.json", JSON.stringify(json.data, null, 2));

} catch (error) {
  console.error("Fallo crítico al hacer fetch de Biografias:", error);
  process.exit(1);
}