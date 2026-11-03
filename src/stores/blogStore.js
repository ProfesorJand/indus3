import { atom } from 'nanostores';

/**
 * ============================================================================
 * STORE GLOBAL Y UTILIDADES PARA EL BLOG DE INDUS3
 * ============================================================================
 */

// Estado global para la etiqueta activa seleccionada en el blog
export const activeBlogTag = atom('todos');

// Estado global para el término de búsqueda en el blog
export const searchBlogQuery = atom('');

// Acciones para actualizar el estado del blog
export const setBlogTag = (tag) => {
  activeBlogTag.set(tag);
};

export const setBlogQuery = (query) => {
  searchBlogQuery.set(query);
};

export const resetBlogFilters = () => {
  activeBlogTag.set('todos');
  searchBlogQuery.set('');
  if (typeof window !== 'undefined' && (window.location.pathname === '/blog' || window.location.pathname === '/blog/')) {
    window.history.replaceState(null, '', '/blog/');
  }
};

// Formatear fechas a español (ej. "28 de Octubre, 2026")
export const formatBlogDate = (dateString) => {
  if (!dateString) return '';
  const cleanStr = String(dateString).replace(' ', 'T');
  const date = new Date(cleanStr);
  if (isNaN(date.getTime())) return dateString;

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${date.getDate()} de ${meses[date.getMonth()]}, ${date.getFullYear()}`;
};

// Helper para extraer información de videos de YouTube (estándar o Shorts)
export const parseYouTubeVideo = (url) => {
  if (!url) {
    return {
      youtubeId: null,
      isShort: false,
      embedUrl: null,
      thumbnailMaxRes: null,
      thumbnailHq: null
    };
  }

  const raw = String(url).trim();
  const isShort = raw.includes('/shorts/');
  const match =
    raw.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i) ||
    raw.match(/^([\w-]{11})$/);
  const youtubeId = match ? match[1] : null;

  return {
    youtubeId,
    isShort,
    embedUrl: youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null,
    thumbnailMaxRes: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null,
    thumbnailHq: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null
  };
};

// Normalizar la publicación proveniente de MySQL
export const normalizePost = (post) => {
  if (!post) return null;

  let tags = [];
  if (Array.isArray(post.tags)) {
    tags = post.tags
      .map((t) => {
        if (typeof t === 'string') return t;
        return t.slug || t.nombre || '';
      })
      .filter(Boolean);
  }

  const rawCreatedAt = post.created_at || '';
  const rawUpdatedAt = post.updated_at || '';
  const dateOnly = rawCreatedAt ? String(rawCreatedAt).split(' ')[0] : '';
  const updatedDateOnly = rawUpdatedAt ? String(rawUpdatedAt).split(' ')[0] : '';

  // Determinar si fue actualizado posteriormente a su publicación original (> 10 min de diferencia)
  let isUpdated = false;
  if (rawCreatedAt && rawUpdatedAt) {
    const createdTime = new Date(String(rawCreatedAt).replace(' ', 'T')).getTime();
    const updatedTime = new Date(String(rawUpdatedAt).replace(' ', 'T')).getTime();
    if (!isNaN(createdTime) && !isNaN(updatedTime) && (updatedTime - createdTime > 10 * 60 * 1000)) {
      isUpdated = true;
    }
  }

  // Detección de Video / Short para apertura en modal (falso blog)
  const yt = parseYouTubeVideo(post.video);
  const rawReadTime = String(post.read_time || post.readTime || '').trim();
  const isVideoModal =
    rawReadTime.toLowerCase() === 'video' ||
    Boolean(yt.youtubeId && (!post.content || post.content.trim() === '' || post.content.trim() === '<p>Video de YouTube</p>'));

  // Si es un video modal y no tiene imagen de portada personalizada, utilizar miniatura de YouTube
  let finalImage = post.image || '';
  if ((!finalImage || finalImage === '/indus3-logo.webp') && yt.thumbnailMaxRes) {
    finalImage = yt.thumbnailMaxRes;
  }
  if (!finalImage) {
    finalImage = '/indus3-logo.webp';
  }

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    seoTitle: post.seo_title || post.seoTitle || post.title || '',
    keywords: post.keywords || '',
    excerpt: post.excerpt || '',
    content: post.content || '',
    image: finalImage,
    customImage: post.image || '',
    video: post.video || null,
    youtubeId: yt.youtubeId,
    isShort: yt.isShort,
    isVideoModal,
    featured: Boolean(Number(post.featured)),
    readTime: isVideoModal ? 'Video' : (rawReadTime || '4 min de lectura'),
    date: dateOnly,
    formattedDate: formatBlogDate(rawCreatedAt),
    createdAt: rawCreatedAt,
    updatedAt: rawUpdatedAt,
    updatedDate: updatedDateOnly,
    formattedUpdatedDate: formatBlogDate(rawUpdatedAt),
    isUpdated,
    author: {
      name: post.autor_nombre || 'Equipo Indus3',
      role: post.autor_rol || 'Redacción & Producción',
      avatar: post.autor_avatar || '/indus3-logo.webp',
      bio: post.autor_bio || 'Equipo editorial y de producción de Indus3 Pro.'
    },
    tags
  };
};

// Obtener todas las publicaciones ordenadas de más reciente a más antigua (Lectura Pública)
export const getSortedBlogPosts = async () => {
  try {
    const res = await fetch('https://api.indus3pro.com/blog/get_posts.php?t=' + Date.now());
    if (!res.ok) return [];
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.success && Array.isArray(data.posts)) {
        return data.posts
          .filter((p) => p.status === 'published')
          .map(normalizePost)
          .sort((a, b) => {
            // 1. Los posts destacados aparecen primero
            if (a.featured !== b.featured) {
              return a.featured ? -1 : 1;
            }
            // 2. Luego ordenados cronológicamente de más reciente a más antiguo
            const timeA = new Date(a.createdAt || a.date).getTime() || 0;
            const timeB = new Date(b.createdAt || b.date).getTime() || 0;
            return timeB - timeA;
          });
      }
    } catch {
      // Respuesta de firewall no es JSON
    }
  } catch (err) {
    console.error('Error al obtener posts de Indus3 Blog:', err);
  }
  return [];
};

// Obtener un post por su slug (Lectura Pública)
export const getBlogPostBySlug = async (slug) => {
  try {
    const res = await fetch(`https://api.indus3pro.com/blog/get_posts.php?slug=${encodeURIComponent(slug)}&t=${Date.now()}`);
    if (!res.ok) return null;
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.success && data.post) {
        return normalizePost(data.post);
      }
    } catch {
      // Respuesta de firewall no es JSON
    }
  } catch (err) {
    console.error('Error al consultar post por slug en Indus3:', err);
  }
  return null;
};

// Obtener lista de tags (Lectura Pública, opcionalmente solo aquellas con posts publicados)
export const getBlogTags = async (publishedOnly = false) => {
  try {
    const url = `https://api.indus3pro.com/blog/tags.php?${publishedOnly ? 'published_only=1&' : ''}t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.success && Array.isArray(data.tags)) {
        return data.tags;
      }
    } catch {
      // Respuesta de firewall no es JSON
    }
  } catch (err) {
    console.error('Error al obtener etiquetas del blog:', err);
  }
  return [];
};

// Filtrar publicaciones por tag y búsqueda (en título, extracto, contenido completo, autor y tags)
export const filterBlogPosts = (posts = [], tag = 'todos', query = '') => {
  const normalizedTag = (tag || 'todos').toLowerCase().trim();
  const normalizedQuery = (query || '').toLowerCase().trim();

  return posts.filter((post) => {
    // 1. Coincidencia por etiqueta / categoría seleccionada
    const matchesTag =
      normalizedTag === 'todos' ||
      post.tags.some((t) => {
        const lower = typeof t === 'string' ? t.toLowerCase().trim() : '';
        return (
          lower === normalizedTag ||
          lower.replace(/\s+/g, '-') === normalizedTag.replace(/\s+/g, '-')
        );
      });

    if (!matchesTag) return false;
    if (normalizedQuery === '') return true;

    // 2. Coincidencia por texto de búsqueda:
    // a. Título H1 y Título SEO
    const titleMatch =
      (post.title || '').toLowerCase().includes(normalizedQuery) ||
      (post.seoTitle || '').toLowerCase().includes(normalizedQuery);

    // b. Extracto / Resumen
    const excerptMatch = (post.excerpt || '').toLowerCase().includes(normalizedQuery);

    // c. Nombre del Autor
    const authorMatch = (post.author?.name || '').toLowerCase().includes(normalizedQuery);

    // d. Palabras Clave (SEO Keywords)
    const keywordsMatch = (post.keywords || '').toLowerCase().includes(normalizedQuery);

    // e. Etiquetas (Tags)
    const tagsMatch =
      Array.isArray(post.tags) &&
      post.tags.some((t) => (typeof t === 'string' ? t : '').toLowerCase().includes(normalizedQuery));

    // f. Contenido Completo del Artículo (limpiando etiquetas HTML para buscar texto real)
    const contentText = (post.content || '').replace(/<[^>]+>/g, ' ').toLowerCase();
    const contentMatch = contentText.includes(normalizedQuery);

    return titleMatch || excerptMatch || authorMatch || keywordsMatch || tagsMatch || contentMatch;
  });
};

