export const urlNoticias = "https://api.indus3pro.com/noticias/noticias.php";

const defaultEmptyConfig = {
  enabled: false,
  badgeText: 'NOTICIAS',
  speed: 'normal',
  separator: '✦',
  spacing: 'double',
  items: []
};

let memoryNewsConfig = null;

/**
 * Obtiene la configuración de noticias de forma síncrona inmediata (memoria o localStorage)
 * Evita cualquier parpadeo de carga al navegar entre páginas.
 */
export const getSyncNewsConfig = () => {
  if (memoryNewsConfig) return memoryNewsConfig;
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('indus3_news_ticker');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items) && parsed.items.length > 0) {
          memoryNewsConfig = parsed;
          return parsed;
        }
      }
    } catch (e) {}
  }
  return null;
};

/**
 * Obtiene las noticias y configuración desde la base de datos (PHP)
 */
export const getNewsConfig = async () => {
  // 1. Intentar obtener desde la API PHP en GoDaddy
  try {
    const res = await fetch(`${urlNoticias}?t=${Date.now()}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const fresh = {
          enabled: json.config?.enabled ?? (json.data.length > 0),
          badgeText: json.config?.badgeText ?? 'NOTICIAS',
          speed: json.config?.speed ?? 'normal',
          separator: json.config?.separator ?? '✦',
          spacing: json.config?.spacing ?? 'double',
          items: json.data
        };
        memoryNewsConfig = fresh;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('indus3_news_ticker', JSON.stringify(fresh));
          } catch (e) {}
        }
        return fresh;
      }
    }
  } catch (err) {
    // Si la API remota aún no está subida o falla la red
    console.warn("No se pudo conectar con noticias.php:", err);
  }

  // 2. Si ya tenemos datos en memoria o localStorage, usarlos de inmediato
  const sync = getSyncNewsConfig();
  if (sync) return sync;

  // 3. Fallback: sin noticias y desactivado para no mostrar la barra
  return defaultEmptyConfig;
};

const getAuthHeader = () => {
  const key = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_BACKEND_AUTH_KEY)
    || (typeof process !== 'undefined' && process.env?.PUBLIC_BACKEND_AUTH_KEY)
    || 'XW5V7VNGYUMILM1SJOAEKI8W48F1PVKW';
  return `Bearer ${key}`;
};

/**
 * Guarda todas las noticias y configuración en la base de datos mediante POST a noticias.php
 */
export const saveNewsConfig = async (config) => {
  memoryNewsConfig = config;

  // 1. Notificar inmediatamente al frontend local y guardar en localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('indus3_news_ticker', JSON.stringify(config));
      window.dispatchEvent(new CustomEvent('indus3_news_updated', { detail: config }));
    } catch (e) {}
  }

  // 2. Guardar en el endpoint PHP de GoDaddy
  try {
    const res = await fetch(urlNoticias, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        action: 'save_all',
        config: {
          enabled: config.enabled,
          badgeText: config.badgeText,
          speed: config.speed,
          separator: config.separator,
          spacing: config.spacing
        },
        items: config.items
      })
    });

    const data = await res.json();
    if (data && data.success) {
      if (Array.isArray(data.data)) {
        config.items = data.data;
        memoryNewsConfig = config;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('indus3_news_ticker', JSON.stringify(config));
            window.dispatchEvent(new CustomEvent('indus3_news_updated', { detail: config }));
          } catch (e) {}
        }
      }
      return { success: true, message: data.message, data: data.data };
    }
  } catch (err) {
    console.warn("Fallo al guardar en noticias.php:", err);
  }

  return { success: true, message: "Guardado en caché local" };
};

/**
 * Elimina una noticia por su ID mediante método DELETE en PHP
 */
export const deleteNewsItem = async (id) => {
  try {
    const res = await fetch(`${urlNoticias}?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      }
    });
    return await res.json();
  } catch (err) {
    console.error("Error al eliminar noticia en API:", err);
    return { success: false, message: err.message };
  }
};
