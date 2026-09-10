import { chromium } from "playwright";
import fs from "fs";

const TOP_50_GLOBAL ="https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF";
const OUTPUT_FILE = "./spotify-data-global.json";

const BATCH_SIZE = 3;
const DELAY_BETWEEN_BATCHES = 2000;

const today = new Date();
const date = `${today.getFullYear()}-${String(
  today.getMonth() + 1
).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

// 🔹 limpiar número
function parseNumber(text) {
  if (!text) return 0;
  return Number(text.replace(/[^\d]/g, ""));
}

async function scrollUntil50Tracks(page) {
  let attempts = 0;
  let tracks = await page.locator('[data-testid="tracklist-row"]').all();
  
  while (tracks.length < 50 && attempts < 20) {
    const lastTrack = tracks[tracks.length - 1];
    if (lastTrack) {
      await lastTrack.scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 500);
    }
    await page.waitForTimeout(1500);
    tracks = await page.locator('[data-testid="tracklist-row"]').all();
    console.log(`⏳ Cargando tracks de la playlist... (${tracks.length}/50)`);
    attempts++;
  }
}

async function getArtistUrlsFromPlaylist(browser, url) {
  const page = await browser.newPage();
  console.log(`🔍 Accediendo a la playlist: ${url}`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('[data-testid="playlist-tracklist"]', { timeout: 15000 });
    await scrollUntil50Tracks(page);
    
    const tracks = await page.locator('[data-testid="tracklist-row"]').all();
    console.log(`📑 Tracks detectados: ${tracks.length}`);
    
    const artistUrls = new Set();
    for (const track of tracks) {
      const artistLinks = await track.locator('a[href*="/artist/"]').all();
      for (const link of artistLinks) {
        const href = await link.getAttribute("href");
        if (href) {
          const absoluteUrl = href.startsWith("http") ? href : "https://open.spotify.com" + href;
          artistUrls.add(absoluteUrl);
        }
      }
    }

    const uniqueArtists = Array.from(artistUrls);
    console.log(`✅ Se encontraron ${uniqueArtists.length} artistas únicos.`);
    return uniqueArtists;
  } catch (e) {
    console.log("⚠️ No se pudieron obtener los artistas de la playlist:", e.message);
    return [];
  } finally {
    try {
      await page.close();
    } catch(e) {}
  }
}

// 🔹 scraper principal
async function scrapeArtist(browser, url) {
  const page = await browser.newPage();

  let name = null;
  let listeners = null;
  let artistImage = null;

  try {
    // Solo domcontentloaded para ir rápido
    await page.goto(url + "?locale=en", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // 🎤 Nombre
    try {
      const fullTitle = await page.title(); 
      name = fullTitle.split('|')[0].trim();
    } catch (e) {
      console.log("⚠️ Nombre no encontrado:", e.message);
    }

    // 👥 Monthly listeners (Selector robusto)
    try {
      const listenersElement = page.locator('span:has-text("monthly listeners")').first();
      await listenersElement.waitFor({ state: 'visible', timeout: 5000 });
      const listenersText = await listenersElement.textContent();
      listeners = parseNumber(listenersText);
    } catch (e) {
      console.log("⚠️ Monthly listeners no encontrado");
    }

    // 🖼️ Imagen de perfil (vía meta tag - súper rápido y confiable)
    try {
      artistImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    } catch (e) {
      console.log("⚠️ Imagen de perfil vía meta no encontrada");
    }

    console.log(`✅ ${name || "Sin nombre"} (${listeners || 0} oyentes)`);
  } catch (error) {
    console.error("❌ Error cargando página:", url, error.message);
  } finally {
    try {
      await page.close();
    } catch(e) {}
  }

  return {
    name,
    url,
    listeners,
    artistImage,
    date: date,
  };
}

async function run() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const allArtistUrls = new Set();
  console.log("🚀 Iniciando extracción de artistas del Top 50 Global...");

  const artists = await getArtistUrlsFromPlaylist(browser, TOP_50_GLOBAL);
  artists.forEach(url => allArtistUrls.add(url));

  const uniqueArtistUrls = Array.from(allArtistUrls);
  console.log(`🎵 Se procesarán ${uniqueArtistUrls.length} artistas en total.`);

  const results = [];

  for (let i = 0; i < uniqueArtistUrls.length; i += BATCH_SIZE) {
    const batch = uniqueArtistUrls.slice(i, i + BATCH_SIZE);
    console.log(`📦 Procesando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(uniqueArtistUrls.length / BATCH_SIZE)}...`);

    const batchResults = await Promise.all(
      batch.map((url) => scrapeArtist(browser, url))
    );

    results.push(...batchResults.filter(r => r && r.name && r.listeners > 0)); 

    if (i + BATCH_SIZE < uniqueArtistUrls.length) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }

  // 🏆 Calcular ranking y ordenar a todos los artistas encontrados
  const finalResults = results
    .sort((a, b) => (b.listeners || 0) - (a.listeners || 0)) // Ordenar por oyentes
    .map((artist, index) => ({
      ...artist,
      rank: index + 1
    }));

  await browser.close();
  saveResults(finalResults);
}

// 💾 guardar JSON seguro
function saveResults(data) {
  let existingData = [];

  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const raw = fs.readFileSync(OUTPUT_FILE, "utf-8").trim();
      if (raw) existingData = JSON.parse(raw);
    }
  } catch {
    existingData = [];
  }

  let newData = [...existingData];

  for (const newItem of data) {
    const index = newData.findIndex(
      (item) => item.url === newItem.url && (item.date || item.month) === (newItem.date || newItem.month)
    );

    if (index !== -1) {
      newData[index] = newItem;
    } else {
      newData.push(newItem);
    }
  }

  // 🧹 Limpieza: Mantener únicamente los registros de las 2 fechas/meses más recientes
  const uniqueDates = [
    ...new Set(newData.map((item) => item.date || item.month)),
  ]
    .filter(Boolean)
    .sort()
    .reverse();

  const allowedDates = new Set(uniqueDates.slice(0, 2));
  const beforeCount = newData.length;

  newData = newData.filter((item) =>
    allowedDates.has(item.date || item.month)
  );

  if (beforeCount > newData.length) {
    console.log(
      `🧹 Limpieza de historial: se mantuvieron las fechas (${Array.from(
        allowedDates
      ).join(", ")}) — ${beforeCount - newData.length} registros antiguos eliminados.`
    );
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newData, null, 2));
  console.log(`\n💾 ¡Éxito! Datos guardados en ${OUTPUT_FILE} (${newData.length} registros totales correspondientes al mes actual y anterior)`);
}

run();