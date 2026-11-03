import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { setBlogTag } from '@stores/blogStore';
import styles from './css/BlogCard.module.css';

/**
 * ============================================================================
 * COMPONENTE BLOG CARD - INDUS3
 * ============================================================================
 * Tarjeta individual para mostrar una noticia en la grilla del blog.
 * Soporta dos modalidades:
 * 1. Artículo Tradicional: Navega a la página /blog/[slug]/
 * 2. Video Modal (Falso Blog): Solo muestra el thumbnail (16:9) con botón play
 *    y abre el video/short de YouTube en un modal sin salir de la página.
 */
const BlogCard = ({ post }) => {
  if (!post) return null;

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Escuchar tecla ESC y bloquear el scroll del body mientras el modal esté abierto
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen]);

  const handleTagClick = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    const isBlogListPage =
      typeof window !== 'undefined' &&
      (window.location.pathname === '/blog' || window.location.pathname === '/blog/');

    if (isBlogListPage) {
      setBlogTag(tag);
      window.history.replaceState(null, '', `/blog/?tag=${encodeURIComponent(tag)}`);
    } else {
      window.location.href = `/blog/?tag=${encodeURIComponent(tag)}`;
    }
  };

  // =========================================================================
  // MODALIDAD 1: CARD DE VIDEO (FALSO BLOG QUE ABRE MODAL EN LA MISMA PÁGINA)
  // =========================================================================
  if (post.isVideoModal) {
    const thumbnailSrc =
      post.image ||
      (post.youtubeId ? `https://img.youtube.com/vi/${post.youtubeId}/maxresdefault.jpg` : '/indus3-logo.webp');

    return (
      <>
        <div
          role="button"
          tabIndex={0}
          className={`${styles.card} ${styles.videoCard}`}
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
          aria-label={`Reproducir video: ${post.title}`}
        >
          {/* 1. Miniatura 16:9 con Botón Play y Badge */}
          <div className={styles.imageWrapper}>
            <img
              src={thumbnailSrc}
              alt={post.title}
              className={styles.image}
              loading="lazy"
              onError={(e) => {
                // Fallback a hqdefault si maxresdefault no está disponible en YouTube
                if (post.youtubeId && !e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = 'true';
                  e.currentTarget.src = `https://img.youtube.com/vi/${post.youtubeId}/hqdefault.jpg`;
                } else {
                  e.currentTarget.src = '/indus3-logo.webp';
                }
              }}
            />

            {/* Gradiente oscuro sobre la imagen */}
            <div className={styles.imageOverlay} />

            {/* Badge distintivo de Video o Short */}
            <span className={styles.readTimeBadge}>
              {post.isShort ? '⚡ SHORT' : '▶ VIDEO'}
            </span>

            {/* Botón Play central con animación */}
            <div className={styles.playButtonWrapper} aria-hidden="true">
              <div className={styles.playButtonCircle}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          </div>

          {/* 2. Cuerpo de la tarjeta del video */}
          <div className={styles.cardBody}>
            {/* Etiquetas (Tags) */}
            {post.tags && post.tags.length > 0 && (
              <div className={styles.tagsRow}>
                {post.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.tagPill}
                    onClick={(e) => handleTagClick(e, tag)}
                    title={`Filtrar por ${tag}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Título completo sin elipsis */}
            <h3 className={styles.title}>{post.title}</h3>

            {/* Extracto / Resumen opcional del video sin elipsis */}
            {post.excerpt && post.excerpt.trim() !== '' && (
              <p className={styles.excerpt}>{post.excerpt}</p>
            )}

            {/* Botón Ver video */}
            <span className={styles.watchVideoBtn}>
              Ver video
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>

            {/* Pie de la card: Autor (nombre) y Fecha de publicación */}
            <div className={styles.cardFooter}>
              <div className={styles.authorSection}>
                <div className={styles.authorMeta}>
                  <span className={styles.authorName}>{post.author?.name || 'Equipo Indus3'}</span>
                  <span className={styles.postDate}>{post.formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Interactivo de YouTube */}
        {isModalOpen && typeof document !== 'undefined' && createPortal(
          <div
            className={styles.videoModalBackdrop}
            onClick={() => setIsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={post.title}
          >
            <div
              className={`${styles.videoModalBox} ${post.isShort ? styles.modalShortBox : styles.modalStandardBox}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar reproductor de video"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className={`${styles.videoPlayerFrame} ${post.isShort ? styles.frameShort : styles.frameStandard}`}>
                {post.youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${post.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                    title={post.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className={styles.noVideoPlaceholder}>
                    <p>No se pudo cargar el video de YouTube.</p>
                  </div>
                )}
              </div>

              {post.title && (
                <div className={styles.modalCaption}>
                  <h4 className={styles.modalCaptionTitle}>{post.title}</h4>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // =========================================================================
  // MODALIDAD 2: CARD DE ARTÍCULO ESTÁNDAR
  // =========================================================================
  return (
    <a href={`/blog/${post.slug}/`} className={styles.card} aria-label={`Leer artículo: ${post.title}`}>
      <div className={styles.imageWrapper}>
        <img
          src={post.image || '/indus3-logo.webp'}
          alt={post.title}
          className={styles.image}
          loading="lazy"
        />
        <div className={styles.imageOverlay} />
        <span className={styles.readTimeBadge}>{post.readTime}</span>
      </div>

      <div className={styles.cardBody}>
        {post.tags && post.tags.length > 0 && (
          <div className={styles.tagsRow}>
            {post.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={styles.tagPill}
                onClick={(e) => handleTagClick(e, tag)}
                title={`Filtrar por ${tag}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.excerpt}>{post.excerpt}</p>
        <span className={styles.readMoreBtn}>
          Leer más
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>

        <div className={styles.cardFooter}>
          <div className={styles.authorSection}>
            {/* <img
              src={post.author?.avatar || '/indus3-logo.webp'}
              alt={post.author?.name || 'Autor'}
              className={styles.avatar}
              loading="lazy"
            /> */}
            <div className={styles.authorMeta}>
              <span className={styles.authorName}>{post.author?.name || 'Equipo Indus3'}</span>
              <span className={styles.postDate}>{post.formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

export default BlogCard;
