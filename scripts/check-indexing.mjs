import { google } from 'googleapis';
import fs from 'fs';

const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_KEY;

if (!credentialsJson) {
  console.error("❌ Faltan las credenciales. Configura GCP_SERVICE_ACCOUNT_KEY en las variables de entorno o GitHub Secrets.");
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(credentialsJson);
} catch (e) {
  console.error("❌ El secreto GCP_SERVICE_ACCOUNT_KEY no tiene formato JSON válido.");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/webmasters'],
});

const searchconsole = google.searchconsole({
  version: 'v1',
  auth,
});

const siteUrl = 'sc-domain:indus3pro.com';

// URLs a inspeccionar pasadas por argumento o una lista por defecto
const targetUrls = process.argv.slice(2).length > 0 
  ? process.argv.slice(2) 
  : [
      'https://indus3pro.com/',
      'https://indus3pro.com/blog/',
      'https://indus3pro.com/top-spotify/',
      'https://indus3pro.com/top-spotify/artistas-venezolanos/',
      'https://indus3pro.com/top-spotify/artistas-globales/',
      'https://indus3pro.com/top-spotify/canciones-globales/'
    ];

async function checkUrl(url) {
  try {
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: url,
        siteUrl: siteUrl,
      },
    });

    const result = res.data.inspectionResult;
    const indexStatus = result.indexStatusResult || {};

    const verdict = indexStatus.verdict || 'DESCONOCIDO';
    const coverage = indexStatus.coverageState || 'No disponible';
    const lastCrawl = indexStatus.lastCrawlTime || 'Nunca rastreado';
    const robots = indexStatus.robotsTxtState || 'N/A';
    const indexing = indexStatus.indexingState || 'N/A';

    console.log(`\n🔍 URL: ${url}`);
    console.log(`   • Veredicto:        ${verdict === 'PASS' ? '✅ EN GOOGLE' : '⚠️ ' + verdict}`);
    console.log(`   • Estado Cobertura: ${coverage}`);
    console.log(`   • Último Rastreo:   ${lastCrawl}`);
    console.log(`   • Indexación:       ${indexing}`);
    console.log(`   • Robots.txt:       ${robots}`);

    return { url, verdict, coverage, lastCrawl };
  } catch (err) {
    console.error(`❌ Error inspeccionando ${url}:`, err.message);
    return { url, error: err.message };
  }
}

async function run() {
  console.log("==================================================");
  console.log("📊 INSPECCIÓN DE INDEXACIÓN EN GOOGLE SEARCH CONSOLE");
  console.log(`🌐 Propiedad: ${siteUrl}`);
  console.log("==================================================");

  for (const url of targetUrls) {
    await checkUrl(url);
    // Pausa para respetar límites de cuota de la API
    await new Promise(r => setTimeout(r, 600));
  }

  console.log("\n🏁 Inspección finalizada.");
}

run().catch(console.error);

