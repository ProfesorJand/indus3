import { chromium } from "playwright";
import fs from "fs";

// URL de la Playlist Top 50 Global
const TOP_50_GLOBAL = "https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF";
const OUTPUT_FILE = "./spotify-top-50-songs-global.json";

/**
 * Función para asegurar que Spotify cargue las 50 canciones (Lazy Loading)
 */
async function scrollUntil50Tracks(page) {
  let tracks = await page.locator('[data-testid="tracklist-row"]').all();
  let lastCount = 0;
  let attempts = 0;

  while (tracks.length < 50 && attempts < 15) {
    const lastTrack = tracks[tracks.length - 1];
    if (lastTrack) {
        await lastTrack.scrollIntoViewIfNeeded();
        await page.mouse.wheel(0, 1000);
    }
    await page.waitForTimeout(2000);
    tracks = await page.locator('[data-testid="tracklist-row"]').all();
    
    if (tracks.length === lastCount) attempts++;
    else attempts = 0;
    
    lastCount = tracks.length;
    console.log(`⏳ Cargando canciones... (${tracks.length}/50)`);
  }
}

async function scrapePlaylist() {
  // Lanzamos el navegador
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-http2']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  console.log(`🔍 Accediendo a la playlist: ${TOP_50_GLOBAL}`);

  try {
    // Vamos a la página con un tiempo de espera amplio
    await page.goto(TOP_50_GLOBAL, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector('[data-testid="playlist-tracklist"]', { timeout: 20000 });

    // Hacemos scroll para revelar todo el contenido
    await scrollUntil50Tracks(page);

    const trackRows = await page.locator('[data-testid="tracklist-row"]').all();
    const results = [];
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < Math.min(50, trackRows.length); i++) {
      const row = trackRows[i];
      
      const songData = {
        rank: i + 1,
        title: "N/A",
        artists: "N/A",
        image: "N/A",
        album: "N/A",
        duration: "N/A",
        url: "N/A",
        plays: "N/A",
        updatedAt: today
      };

      // Título
      try {
        songData.title = await row.locator('[data-testid="internal-track-link"]').first().textContent();
      } catch {}

      // Artistas (Múltiples permitidos)
      try {
        const artistElements = await row.locator('a[href*="/artist/"]').all();
        const artistNames = [];
        for (const el of artistElements) {
          const text = await el.textContent();
          if (text) artistNames.push(text);
        }
        songData.artists = artistNames.join(", ");
      } catch {}

      // Imagen
      try {
        songData.image = await row.locator('img').first().getAttribute("src");
      } catch {}

      // Álbum
      try {
        songData.album = await row.locator('a[href*="/album/"]').first().textContent();
      } catch {}

      // URL de la canción
      try {
        const trackLink = await row.locator('a[href*="/track/"]').first().getAttribute("href");
        songData.url = trackLink ? "https://open.spotify.com" + trackLink : "N/A";
      } catch {}

      // Duración
      try {
        const durationDiv = await row.locator('div:has-text(":")').last();
        songData.duration = await durationDiv.textContent();
      } catch {}

      // Plays (Intentamos capturar el contador si existe en la columna)
      try {
         const texts = await row.locator('div').allTextContents();
         for(let t of texts) {
            const clean = t.trim();
            // Buscamos strings que solo tengan números y comas/puntos y sean largos (> 5 dígitos para evitar otros números)
            if (/^[\d,.]+$/.test(clean) && clean.length > 5) {
                songData.plays = clean;
                break;
            }
         }
      } catch {}

      results.push(songData);
      console.log(`✅ [${songData.rank}] ${songData.title} - ${songData.artists}`);
    }

    // Guardar el resultado final
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`\n💾 ¡Éxito! Datos guardados en ${OUTPUT_FILE}`);

  } catch (error) {
    console.error("❌ Error durante la ejecución:", error.message);
  } finally {
    await browser.close();
  }
}

// Ejecutar
scrapePlaylist();