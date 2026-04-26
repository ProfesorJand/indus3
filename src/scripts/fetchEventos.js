import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const res = await fetch("https://api.indus3pro.com/eventos/get-eventos.php?t="+Date.now(), {
  headers: {
    Authorization: `Bearer ${process.env.PUBLIC_BACKEND_AUTH_KEY}`
  }
});

const text = await res.text();
console.log("STATUS:", res.status);
console.log("RAW:", text);

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

fs.writeFileSync("./src/data/eventos.json", JSON.stringify(json.data, null, 2));

console.log("Eventos guardados ✅");