import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const res = await fetch("https://api.indus3pro.com/biografias/get-biografias.php?t="+Date.now(), {
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

console.log("Biografias guardadas ✅");