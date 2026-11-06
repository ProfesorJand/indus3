import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { activeBlogTag, searchBlogQuery, resetBlogFilters, filterBlogPosts, normalizePost, isUserAdmin } from '@stores/blogStore';
import BlogCard from './BlogCard.jsx';
import styles from './css/BlogGrid.module.css';

/**
 * ============================================================================
 * COMPONENTE BLOG GRID - INDUS3
 * ============================================================================
 * Grilla interactiva de noticias filtrada por etiqueta y texto de búsqueda.
 */
const BlogGrid = ({ initialPosts = [] }) => {
  const currentTag = useStore(activeBlogTag);
  const currentQuery = useStore(searchBlogQuery);
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Consultar publicaciones actualizadas desde la base de datos de Indus3
  useEffect(() => {
    const adminActive = isUserAdmin();
    setIsAdmin(adminActive);

    const fetchPosts = async () => {
      try {
        const res = await fetch('https://api.indus3pro.com/blog/get_posts.php?t=' + Date.now());
        const data = await res.json();
        if (data.success && Array.isArray(data.posts)) {
          const normalized = data.posts
            .filter((p) => adminActive ? (p.status === 'published' || p.status === 'draft') : p.status === 'published')
            .map(normalizePost)
            .sort((a, b) => {
              if (a.featured !== b.featured) {
                return a.featured ? -1 : 1;
              }
              const timeA = new Date(a.createdAt || a.date).getTime() || 0;
              const timeB = new Date(b.createdAt || b.date).getTime() || 0;
              return timeB - timeA;
            });
          setPosts(normalized);
        }
      } catch (err) {
        console.error('Error al actualizar posts en el cliente:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Publicaciones filtradas
  const filteredPosts = filterBlogPosts(posts, currentTag, currentQuery);
  const isFiltering = currentTag !== 'todos' || currentQuery.trim() !== '';

  return (
    <div className={styles.gridContainer}>
      <div className={styles.resultsHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span>
            Mostrando <span className={styles.countHighlight}>{filteredPosts.length}</span>{' '}
            {filteredPosts.length === 1 ? 'noticia o artículo' : 'noticias o artículos'}
          </span>
          {isAdmin && (
            <span
              title="Sesión de administrador activa. Los borradores solo son visibles para ti."
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#fef08a',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              🛡️ Vista Admin (Borradores visibles)
            </span>
          )}
        </div>

        {isFiltering && (
          <button
            type="button"
            className={styles.clearFilterLink}
            onClick={resetBlogFilters}
          >
            Ver todas las publicaciones
          </button>
        )}
      </div>

      {loading && posts.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0' }}>
          Cargando publicaciones de Indus3...
        </p>
      ) : filteredPosts.length > 0 ? (
        <div className={styles.cardsGrid}>
          {filteredPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <h4 className={styles.emptyTitle}>No se encontraron publicaciones</h4>
          <p className={styles.emptyDescription}>
            No hay artículos que coincidan con la etiqueta <strong>"{currentTag}"</strong>
            {currentQuery && ` o la búsqueda "${currentQuery}"`}. Intenta seleccionar otra etiqueta o restablecer los filtros.
          </p>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={resetBlogFilters}
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogGrid;

