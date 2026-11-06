import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * ============================================================================
 * SCRIPT CLI: REPORTES GOOGLE SEARCH CONSOLE - INDUS3
 * ============================================================================
 * Uso:
 *   node scripts/gsc-report.mjs
 *   node scripts/gsc-report.mjs --days 28
 *   node scripts/gsc-report.mjs --month 2026-10
 *   node scripts/gsc-report.mjs --start 2026-10-01 --end 2026-10-31
 * ============================================================================
 */

// 1. Obtener credenciales
let credentialsJson = process.env.GCP_SERVICE_ACCOUNT_KEY;

if (!credentialsJson) {
  const localPaths = [
    path.resolve(process.cwd(), 'gcp_credentials.json'),
    path.resolve(process.cwd(), 'apiIndus3/seo/gcp_credentials.json'),
    path.resolve(process.cwd(), '.secrets/gcp_credentials.json')
  ];
  for (const p of localPaths) {
    if (fs.existsSync(p)) {
      credentialsJson = fs.readFileSync(p, 'utf-8');
      break;
    }
  }
}

if (!credentialsJson) {
  console.error("❌ Faltan las credenciales de Google Search Console.");
  console.error("   Configura la variable de entorno GCP_SERVICE_ACCOUNT_KEY o coloca 'gcp_credentials.json'.");
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(credentialsJson);
} catch (e) {
  console.error("❌ El formato de credenciales JSON no es válido:", e.message);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/webmasters'],
});

const searchconsole = google.searchconsole({
  version: 'v1',
  auth,
});

const siteUrl = 'sc-domain:indus3pro.com';

// 2. Procesar argumentos CLI
const args = process.argv.slice(2);
let customDays = null;
let customMonth = null;
let customStart = null;
let customEnd = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--days' && args[i + 1]) customDays = parseInt(args[i + 1], 10);
  if (args[i] === '--month' && args[i + 1]) customMonth = args[i + 1];
  if (args[i] === '--start' && args[i + 1]) customStart = args[i + 1];
  if (args[i] === '--end' && args[i + 1]) customEnd = args[i + 1];
}

const formatYMD = (d) => d.toISOString().split('T')[0];

let startDate, endDate;
const today = new Date();
const lagDays = 3;
const latestAvailable = new Date(today);
latestAvailable.setDate(today.getDate() - lagDays);

if (customStart && customEnd) {
  startDate = customStart;
  endDate = customEnd;
} else if (customMonth) {
  const [yearStr, monthStr] = customMonth.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  startDate = formatYMD(new Date(y, m - 1, 1));
  endDate = formatYMD(new Date(y, m, 0));
} else if (customDays) {
  const end = new Date(latestAvailable);
  const start = new Date(latestAvailable);
  start.setDate(end.getDate() - customDays + 1);
  startDate = formatYMD(start);
  endDate = formatYMD(end);
} else {
  // Mes anterior por defecto
  const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  startDate = formatYMD(firstDayPrevMonth);
  endDate = formatYMD(lastDayPrevMonth);
}

// Calcular período anterior equivalente
const startD = new Date(startDate);
const endD = new Date(endDate);
const durationDays = Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1;

const prevEndD = new Date(startD);
prevEndD.setDate(startD.getDate() - 1);
const prevStartD = new Date(prevEndD);
prevStartD.setDate(prevEndD.getDate() - durationDays + 1);

const prevStartDate = formatYMD(prevStartD);
const prevEndDate = formatYMD(prevEndD);

console.log("=================================================================");
console.log(`📊 REPORTE GOOGLE SEARCH CONSOLE: ${siteUrl}`);
console.log(`📅 Período Actual:   ${startDate} al ${endDate} (${durationDays} días)`);
console.log(`⏮️  Período Anterior: ${prevStartDate} al ${prevEndDate}`);
console.log("=================================================================\n");

async function queryGsc(start, end, dimensions = [], rowLimit = 100) {
  try {
    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: dimensions.length > 0 ? dimensions : undefined,
        rowLimit,
        aggregationType: 'auto'
      }
    });
    return res.data.rows || [];
  } catch (err) {
    console.error(`❌ Error consultando GSC (${dimensions.join(',')}):`, err.message);
    return [];
  }
}

async function run() {
  console.log("⏳ Consultando Search Console API...");

  // Totales
  const [currOverallRows, prevOverallRows] = await Promise.all([
    queryGsc(startDate, endDate),
    queryGsc(prevStartDate, prevEndDate)
  ]);

  const currTotals = currOverallRows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const prevTotals = prevOverallRows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  const calcDiff = (curr, prev) => {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  };

  const clicksDiff = calcDiff(currTotals.clicks, prevTotals.clicks);
  const impDiff = calcDiff(currTotals.impressions, prevTotals.impressions);
  const ctrDiff = Math.round(((currTotals.ctr - prevTotals.ctr) * 100) * 10) / 10;
  const posDiff = Math.round((currTotals.position - prevTotals.position) * 10) / 10;

  console.log("\n📈 MÉTRICAS PRINCIPALES:");
  console.log(`-----------------------------------------------------------------`);
  console.log(`• Clics Totales:        ${currTotals.clicks} (Prev: ${prevTotals.clicks}) -> ${clicksDiff >= 0 ? '+' : ''}${clicksDiff}%`);
  console.log(`• Impresiones Totales:  ${currTotals.impressions} (Prev: ${prevTotals.impressions}) -> ${impDiff >= 0 ? '+' : ''}${impDiff}%`);
  console.log(`• CTR Promedio:         ${(currTotals.ctr * 100).toFixed(2)}% (Prev: ${(prevTotals.ctr * 100).toFixed(2)}%) -> ${ctrDiff >= 0 ? '+' : ''}${ctrDiff}% pts`);
  console.log(`• Posición Media:       ${currTotals.position.toFixed(1)} (Prev: ${prevTotals.position.toFixed(1)}) -> ${posDiff <= 0 ? '🟢 ' + posDiff : '🔴 +' + posDiff}`);

  // Consultas y Páginas
  console.log("\n⏳ Analizando Páginas y Consultas...");
  const [currPages, prevPages, currQueries, prevQueries, currCountries] = await Promise.all([
    queryGsc(startDate, endDate, ['page'], 200),
    queryGsc(prevStartDate, prevEndDate, ['page'], 200),
    queryGsc(startDate, endDate, ['query'], 200),
    queryGsc(prevStartDate, prevEndDate, ['query'], 200),
    queryGsc(startDate, endDate, ['country'], 20)
  ]);

  const prevPageMap = new Map();
  prevPages.forEach(p => prevPageMap.set(p.keys[0], p));

  const pageComparison = currPages.map(p => {
    const key = p.keys[0];
    const prev = prevPageMap.get(key) || { clicks: 0, impressions: 0 };
    return {
      page: key,
      clicks: p.clicks,
      prevClicks: prev.clicks,
      diffClicks: p.clicks - prev.clicks,
      impressions: p.impressions,
      ctr: (p.ctr * 100).toFixed(1) + '%',
      position: p.position.toFixed(1)
    };
  });

  const pagesUp = [...pageComparison].filter(p => p.diffClicks > 0).sort((a, b) => b.diffClicks - a.diffClicks);
  const pagesDown = [...pageComparison].filter(p => p.diffClicks < 0).sort((a, b) => a.diffClicks - b.diffClicks);

  console.log("\n🚀 PÁGINAS EN ALZA (Top 5 por aumento de clics):");
  if (pagesUp.length === 0) {
    console.log("   (Sin páginas con aumento significativo de clics en este período)");
  } else {
    pagesUp.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.page}`);
      console.log(`      Clics: ${p.clicks} (+${p.diffClicks}) | Imp: ${p.impressions} | CTR: ${p.ctr} | Pos: ${p.position}`);
    });
  }

  console.log("\n🔻 PÁGINAS A LA BAJA (Top 5 por descenso de clics):");
  if (pagesDown.length === 0) {
    console.log("   (Sin descensos registrados)");
  } else {
    pagesDown.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.page}`);
      console.log(`      Clics: ${p.clicks} (${p.diffClicks}) | Imp: ${p.impressions} | CTR: ${p.ctr} | Pos: ${p.position}`);
    });
  }

  // Queries
  const prevQueryMap = new Map();
  prevQueries.forEach(q => prevQueryMap.set(q.keys[0], q));

  const queryComparison = currQueries.map(q => {
    const key = q.keys[0];
    const prev = prevQueryMap.get(key) || { clicks: 0, impressions: 0 };
    return {
      query: key,
      clicks: q.clicks,
      prevClicks: prev.clicks,
      diffClicks: q.clicks - prev.clicks,
      impressions: q.impressions,
      ctr: (q.ctr * 100).toFixed(1) + '%',
      position: q.position.toFixed(1)
    };
  });

  const queriesUp = [...queryComparison].filter(q => q.diffClicks > 0).sort((a, b) => b.diffClicks - a.diffClicks);

  console.log("\n🔍 CONSULTAS EN ALZA (Top 5 por aumento de clics):");
  if (queriesUp.length === 0) {
    console.log("   (Sin consultas con aumento significativo de clics en este período)");
  } else {
    queriesUp.slice(0, 5).forEach((q, i) => {
      console.log(`   ${i + 1}. "${q.query}"`);
      console.log(`      Clics: ${q.clicks} (+${q.diffClicks}) | Imp: ${q.impressions} | CTR: ${q.ctr} | Pos: ${q.position}`);
    });
  }

  console.log("\n🌎 TOP PAÍSES:");
  currCountries.slice(0, 8).forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.keys[0].toUpperCase()}: ${c.clicks} clics | ${c.impressions} impresiones | CTR: ${(c.ctr * 100).toFixed(1)}% | Pos: ${c.position.toFixed(1)}`);
  });

  console.log("\n✅ Reporte finalizado.");
}

run().catch(err => {
  console.error("❌ Error ejecutando reporte:", err);
  process.exit(1);
});

