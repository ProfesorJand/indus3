import React, { useState, useEffect } from 'react';
import styles from './NewsBar.module.css';
import { getNewsConfig, getSyncNewsConfig, urlNoticias } from '../../stores/news.js';
import { renderFormattedNewsText, stripNewsFormatting } from '../../utils/newsFormatter.jsx';

const defaultSettings = {
  enabled: false,
  speed: 'normal',
  spacing: 'double',
  separator: '✦',
  badgeText: 'NOTICIAS',
  items: []
};

const speedMultipliers = {
  slow: 10,
  normal: 6,
  fast: 4.5
};

export default function NewsBar({ initialConfig = null }) {
  const [config, setConfig] = useState(() => {
    if (initialConfig && initialConfig.enabled && Array.isArray(initialConfig.items) && initialConfig.items.length > 0) {
      return initialConfig;
    }
    const sync = getSyncNewsConfig();
    if (sync && sync.enabled && Array.isArray(sync.items) && sync.items.length > 0) {
      return sync;
    }
    return initialConfig || defaultSettings;
  });

  useEffect(() => {
    // Sincronizar con la base de datos en cliente
    getNewsConfig().then((fresh) => {
      if (fresh && typeof fresh === 'object' && Array.isArray(fresh.items)) {
        setConfig(fresh);
      }
    }).catch(() => {});

    // Listen to updates from admin in same window or across tabs
    const handleUpdate = (e) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'indus3_news_ticker' && e.newValue) {
        try {
          setConfig(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    window.addEventListener('indus3_news_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('indus3_news_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!config || !config.enabled) return null;

  const activeItems = (config.items || []).filter(
    (item) => item.enabled !== false && item.text && item.text.trim()
  );

  if (activeItems.length === 0) return null;

  // Auto-fill: Asegura que el bloque tenga al menos 5 repeticiones de contenido.
  // Esto llena toda la pantalla panorámica, elimina el espacio negro vacío
  // y garantiza que el ciclo de animación (-50% a 0%) sea 100% continuo e imperceptible.
  let displayList = [...activeItems];
  while (displayList.length < 5) {
    displayList = [...displayList, ...activeItems];
  }

  // Separación configurable
  let separatorMargin = '40px';
  if (config.spacing === 'normal') separatorMargin = '24px';
  if (config.spacing === 'wide') separatorMargin = '64px';

  // Velocidad de lectura equilibrada y constante en píxeles
  const multiplier = speedMultipliers[config.speed] || speedMultipliers.normal;
  const duration = Math.max(25, Math.round(displayList.length * multiplier));

  const separator = config.separator || '✦';

  const handleClick = (item) => {
    if (!item || !item.id) return;
    try {
      fetch(`${urlNoticias}?action=click&id=${encodeURIComponent(item.id)}`, {
        method: 'POST',
        keepalive: true
      }).catch(() => {});
    } catch (e) {}
  };

  const renderItemContent = (item, keyPrefix) => {
    const target = item.openInNewTab ? '_blank' : undefined;
    const rel = item.openInNewTab ? 'noopener noreferrer' : undefined;

    if (item.url && item.url.trim()) {
      return (
        <span key={`${keyPrefix}-${item.id}`} className={styles.itemGroup}>
          <a
            href={item.url}
            className={styles.itemLink}
            target={target}
            rel={rel}
            title={stripNewsFormatting(item.text)}
            onClick={() => handleClick(item)}
          >
            {renderFormattedNewsText(item.text, styles)}
          </a>
          <span className={styles.separator} aria-hidden="true">
            {separator}
          </span>
        </span>
      );
    }

    return (
      <span key={`${keyPrefix}-${item.id}`} className={styles.itemGroup}>
        <span className={styles.itemText}>{renderFormattedNewsText(item.text, styles)}</span>
        <span className={styles.separator} aria-hidden="true">
          {separator}
        </span>
      </span>
    );
  };

  return (
    <div
      className={styles.newsBar}
      role="region"
      aria-label="Barra de avisos y noticias"
      style={{
        '--marquee-duration': `${duration}s`,
        '--news-separator-margin': separatorMargin
      }}
    >
      {config.badgeText && config.badgeText.trim() && (
        <div className={styles.badge}>
          <span className={styles.pulseDot} aria-hidden="true" />
          <span>{config.badgeText}</span>
        </div>
      )}

      <div className={styles.tickerWrapper}>
        <div className={styles.tickerTrack}>
          {/* Bloque A (contenido original relleno) */}
          <div className={styles.itemGroup}>
            {displayList.map((item, idx) => renderItemContent(item, `c1-${idx}`))}
          </div>
          {/* Bloque B (duplicado para el bucle matemático infinito sin cortes) */}
          <div className={styles.itemGroup} aria-hidden="true">
            {displayList.map((item, idx) => renderItemContent(item, `c2-${idx}`))}
          </div>
        </div>
      </div>
    </div>
  );
}
