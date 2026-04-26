import fs from "fs";

const res = await fetch("https://api.indus3pro.com/eventos/get-eventos.php", {
  headers: {
    Authorization: "Bearer TU_TOKEN"
  }
});

const data = await res.json();

fs.writeFileSync("./src/data/eventos.json", JSON.stringify(data.data, null, 2));

console.log("Eventos guardados ✅");