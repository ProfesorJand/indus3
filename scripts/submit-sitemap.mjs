import { google } from 'googleapis';

const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_KEY;

if (!credentialsJson) {
  console.error("❌ Faltan las credenciales. Configura GCP_SERVICE_ACCOUNT_KEY en GitHub Secrets.");
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

const searchconsole = google.webmasters({
  version: 'v3',
  auth,
});

async function submitSitemap() {
  const siteUrl = 'sc-domain:indus3pro.com'; 
  const sitemaps = [
    'https://indus3pro.com/sitemap-index.xml',
    'https://indus3pro.com/sitemap-0.xml',
  ];

  for (const feedpath of sitemaps) {
    try {
      console.log(`Enviando notificación de sitemap (${feedpath}) a Google Search Console...`);
      await searchconsole.sitemaps.submit({ siteUrl, feedpath });
      console.log(`✅ ¡Sitemap ${feedpath} notificado y enviado con éxito a Google Search Console!`);
    } catch (error) {
      console.error(`❌ Error al notificar ${feedpath} a Google:`, error.message);
    }
  }
}

submitSitemap();
