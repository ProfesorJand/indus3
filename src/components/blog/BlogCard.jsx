import React from 'react';
import { setBlogTag } from '@stores/blogStore';
import styles from './css/BlogCard.module.css';

/**
 * ============================================================================
 * COMPONENTE BLOG CARD - INDUS3
 * ============================================================================
 * Tarjeta individual para mostrar una noticia en la grilla del blog.
 */
const BlogCard = ({ post }) => {
  if (!post) return null;

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
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.excerpt}>{post.excerpt}</p>

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

        <div className={styles.cardFooter}>
          <div className={styles.authorSection}>
            <img
              src={post.author?.avatar || '/indus3-logo.webp'}
              alt={post.author?.name || 'Autor'}
              className={styles.avatar}
              loading="lazy"
            />
            <div className={styles.authorMeta}>
              <span className={styles.authorName}>{post.author?.name || 'Equipo Indus3'}</span>
              <span className={styles.postDate}>{post.formattedDate}</span>
            </div>
          </div>

          <span className={styles.readMoreBtn}>
            Leer más
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
};

export default BlogCard;

