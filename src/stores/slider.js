import fs from 'fs';
import path from 'path';

export const urlSliders = "https://api.indus3pro.com/sliders/get-sliders.php";

export const getSliders = async (retries = 3) => {
  const authKey = (typeof window !== 'undefined' ? sessionStorage.getItem('indus3_admin_token') : null)
    || (typeof import.meta !== 'undefined' && (import.meta.env?.PUBLIC_BACKEND_AUTH_KEY || import.meta.env?.BACKEND_AUTH_KEY))
    || (typeof process !== 'undefined' && (process.env?.PUBLIC_BACKEND_AUTH_KEY || process.env?.BACKEND_AUTH_KEY))
    || '';

  for (let i = 0; i < retries; i++) {
    try {
      const url = `${urlSliders}?t=${Date.now()}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authKey ? `Bearer ${authKey}` : ''
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const text = await response.text();
        const json = JSON.parse(text);
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          // Si estamos en entorno Node.js durante el build de Astro, actualizar respaldo local
          if (typeof process !== 'undefined' && process.versions?.node) {
            try {
              const dataDir = path.resolve(process.cwd(), 'src/data');
              if (fs.existsSync(dataDir)) {
                fs.writeFileSync(path.join(dataDir, 'sliders.json'), JSON.stringify(json.data, null, 2));
              }
            } catch (e) {}
          }
          return json.data;
        }
      }
      console.warn(`[getSliders] Intento ${i + 1} de ${retries} no devolvió datos válidos (Status: ${response?.status}).`);
    } catch (err) {
      console.warn(`[getSliders] Intento ${i + 1} de ${retries} falló (${err.message}).`);
    }

    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Respaldo de emergencia: si la conexión con GoDaddy falla en el runner, usar src/data/sliders.json
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fallbackPath = path.resolve(process.cwd(), 'src/data/sliders.json');
      if (fs.existsSync(fallbackPath)) {
        const localData = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
        if (Array.isArray(localData) && localData.length > 0) {
          console.log(`[getSliders] Usando respaldo local (${localData.length} sliders).`);
          return localData;
        }
      }
    } catch (e) {}
  }

  return [];
};
