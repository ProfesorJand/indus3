import fs from "fs";
import path from "path";
import dns from "dns";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
  });
}

// Forzar IPv4 para evitar timeouts en GitHub Actions
dns.setDefaultResultOrder("ipv4first");

// 1. Consulta directa a MySQL Remoto (salta Imunify360/HTTP completamente)
async function fetchFromMySQL() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASS;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT || 3306);

  if (!host || !user || !password || !database) {
    return null;
  }

  console.log(`[fetchBlog] Conectando directamente a MySQL remoto (${host}:${port}/${database})...`);
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    dateStrings: true,
    charset: "utf8mb4",
    connectTimeout: 15000
  });

  try {
    const [rows] = await connection.query(`
      SELECT p.id, p.slug, p.title, p.seo_title, p.keywords, p.excerpt, p.content, p.image, p.video, p.featured, p.read_time, p.status, p.created_at, p.updated_at,
             a.id AS autor_id, a.nombre AS autor_nombre, a.rol AS autor_rol, a.avatar AS autor_avatar, a.bio AS autor_bio,
             GROUP_CONCAT(t.slug SEPARATOR ',') AS tags_slugs,
             GROUP_CONCAT(t.nombre SEPARATOR ',') AS tags_nombres,
             GROUP_CONCAT(t.id SEPARATOR ',') AS tags_ids
      FROM blog_posts p
      LEFT JOIN blog_autores a ON p.autor_id = a.id
      LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
      LEFT JOIN blog_tags t ON pt.tag_id = t.id
      GROUP BY p.id
      ORDER BY p.featured DESC, p.created_at DESC
    `);

    const posts = rows.map((row) => {
      const tagSlugs = row.tags_slugs ? String(row.tags_slugs).split(",") : [];
      const tagNombres = row.tags_nombres ? String(row.tags_nombres).split(",") : [];
      const tagIds = row.tags_ids ? String(row.tags_ids).split(",") : [];

      const tags = tagSlugs.map((slug, idx) => ({
        id: tagIds[idx] ? parseInt(tagIds[idx], 10) : 0,
        slug,
        nombre: tagNombres[idx] || slug
      }));

      const { tags_slugs, tags_nombres, tags_ids, ...cleanRow } = row;
      return {
        ...cleanRow,
        id: String(cleanRow.id),
        featured: String(cleanRow.featured ?? 0),
        autor_id: cleanRow.autor_id != null ? String(cleanRow.autor_id) : null,
        tags
      };
    });

    return posts;
  } finally {
    await connection.end();
  }
}

async function fetchWithPlaywright(url, authKey) {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        extraHTTPHeaders: { 'Authorization': `Bearer ${authKey}` }
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const body = await page.textContent('body');
      const json = JSON.parse(body);
      return json;
    } finally {
      await browser.close();
    }
  } catch (err) {
    throw new Error("Playwright fallback falló: " + err.message);
  }
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} - ${text.slice(0, 150)}`);
      }

      try {
        const json = JSON.parse(text);
        return json;
      } catch (err) {
        throw new Error(`El servidor no devolvió un JSON válido. Respuesta: ${text.slice(0, 200)}`);
      }
    } catch (error) {
      console.log(`[fetchBlog] Intento ${i + 1} falló: ${error.message}. Reintentando en 3s...`);
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

try {
  let posts = null;

  // Prioridad 1: Conexión directa a MySQL Remoto (recomendado en GitHub Actions)
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME) {
    posts = await fetchFromMySQL();
    console.log(`✅ Artículos del Blog obtenidos directamente desde MySQL (${posts.length} posts).`);
  } else {
    // Prioridad 2: Consulta HTTP a la API PHP (ej. en desarrollo local sin variables DB_*)
    const authKey = process.env.BACKEND_AUTH_KEY || process.env.PUBLIC_BACKEND_AUTH_KEY || '';
    const url = "https://api.indus3pro.com/blog/get_posts.php?t=" + Date.now();
    let json = null;

    try {
      json = await fetchWithRetry(url, {
        headers: {
          "Authorization": `Bearer ${authKey}`,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
      });
    } catch (fetchErr) {
      console.log("[fetchBlog] Petición directa bloqueada (" + fetchErr.message + "). Intentando con Playwright Chromium...");
      try {
        json = await fetchWithPlaywright(url, authKey);
      } catch (pwErr) {
        console.warn("⚠️ [fetchBlog] Playwright tampoco pudo conectar:", pwErr.message);
        throw fetchErr;
      }
    }

    if (!json || !Array.isArray(json.posts)) {
      throw new Error("Respuesta inválida o sin array de posts: " + JSON.stringify(json));
    }

    posts = json.posts;
    console.log(`✅ Artículos del Blog guardados correctamente desde GoDaddy HTTP (${posts.length} posts).`);
  }

  fs.writeFileSync("./src/data/blog.json", JSON.stringify(posts, null, 2));

} catch (error) {
  console.error("❌ No se pudo actualizar el Blog desde GoDaddy:", error.message || error);
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    console.error("🛑 Cancelando deploy en GitHub Actions para evitar publicar el sitio sin los artículos nuevos.");
    process.exit(1);
  }
  if (fs.existsSync("./src/data/blog.json")) {
    console.log("ℹ️ Modo local: usando archivo de respaldo existente (src/data/blog.json). Continuando build...");
  } else {
    console.error("❌ Fallo crítico: no hay datos del blog ni archivo de respaldo.");
    process.exit(1);
  }
}
