import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { activeBlogTag, searchBlogQuery, setBlogTag, setBlogQuery, getBlogTags, normalizePost } from '@stores/blogStore';
import styles from './css/BlogFilter.module.css';

/**
 * ============================================================================
 * COMPONENTE BLOG FILTER - INDUS3
 * ============================================================================
 * Barra de búsqueda y filtrado por etiquetas para las noticias de Indus3.
 * Muestra ÚNICAMENTE categorías que tengan al menos 1 artículo publicado.
 */
const BlogFilter = ({ initialPosts = [] }) => {
  const currentTag = useStore(activeBlogTag);
  const currentQuery = useStore(searchBlogQuery);

  // Extraer tags reales presentes en publicaciones publicadas
  const getTagsFromPosts = (postsList = [], apiTagsList = []) => {
    const presentSlugs = new Set();

    postsList.forEach((post) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((t) => {
          const raw = typeof t === 'string' ? t : (t.slug || t.nombre || '');
          const clean = raw.toLowerCase().trim();
          if (clean) presentSlugs.add(clean);
        });
      }
    });

    if (presentSlugs.size === 0) {
      return [{ id: 'todos', label: 'Todos los Artículos' }];
    }

    const formatted = Array.from(presentSlugs).map((slug) => {
      const match = apiTagsList.find(
        (at) => at.slug?.toLowerCase() === slug || at.nombre?.toLowerCase() === slug
      );
      return {
        id: match ? match.slug : slug,
        label: match ? match.nombre : slug.charAt(0).toUpperCase() + slug.slice(1)
      };
    });

    formatted.sort((a, b) => a.label.localeCompare(b.label));
    return [{ id: 'todos', label: 'Todos los Artículos' }, ...formatted];
  };

  // Inicializar solo con las categorías que tengan posts reales (sin datos falsos o mock)
  const [tags, setTags] = useState(() => getTagsFromPosts(initialPosts));

  useEffect(() => {
    // 1. Leer parámetro ?tag= de la URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tagFromUrl = params.get('tag');
      if (tagFromUrl) {
        setBlogTag(decodeURIComponent(tagFromUrl).toLowerCase());
      }
    }

    // 2. Sincronizar etiquetas de la API y de los posts publicados en el cliente
    const syncActiveTags = async () => {
      try {
        const [apiTags, postsRes] = await Promise.all([
          getBlogTags(true), // Solo tags con posts publicados
          fetch('https://api.indus3pro.com/blog/get_posts.php?t=' + Date.now()).then((r) => r.json()).catch(() => null)
        ]);

        const publishedPosts = (postsRes?.success && Array.isArray(postsRes?.posts))
          ? postsRes.posts.filter((p) => p.status === 'published').map(normalizePost)
          : initialPosts;

        const activeList = getTagsFromPosts(publishedPosts, Array.isArray(apiTags) ? apiTags : []);
        setTags(activeList);
      } catch (e) {
        // Si la red falla, mantenemos los tags derivados de initialPosts
      }
    };

    syncActiveTags();
  }, []);

  const handleTagClick = (tagId) => {
    setBlogTag(tagId);
    if (typeof window !== 'undefined') {
      const url = tagId === 'todos' ? '/blog/' : `/blog/?tag=${encodeURIComponent(tagId)}`;
      window.history.replaceState(null, '', url);
    }
  };

  const handleSearchChange = (event) => {
    setBlogQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setBlogQuery('');
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.topBar}>
        {/* Barra de búsqueda interactiva */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar noticias, eventos o lanzamientos..."
            value={currentQuery}
            onChange={handleSearchChange}
            aria-label="Buscar noticias o eventos"
          />
          {currentQuery && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClearSearch}
              title="Borrar búsqueda"
              aria-label="Borrar búsqueda"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Indicador de filtro activo */}
        <div className={styles.activeStatus}>
          <span>Filtrando por:</span>
          <span className={styles.activeTagHighlight}>
            {currentTag === 'todos' ? 'Todas las noticias' : `#${currentTag}`}
          </span>
        </div>
      </div>

      {/* Solo mostramos la botonera de categorías si existen categorías con artículos publicados */}
      {tags.length > 1 && (
        <div className={styles.tagsWrapper}>
          {tags.map((t) => {
            const isActive = currentTag === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`${styles.tagFilterBtn} ${isActive ? styles.tagFilterBtnActive : ''}`}
                onClick={() => handleTagClick(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BlogFilter;

