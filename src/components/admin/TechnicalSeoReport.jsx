import React, { useState, useEffect } from 'react';
import styles from './css/TechnicalSeoReport.module.css';

/**
 * ============================================================================
 * COMPONENTE REPORTE SEO TÉCNICO - INDUS3
 * ============================================================================
 * Auditoría técnica real (sin datos simulados ni fallbacks ficticios):
 * 1. Google Sitemaps Management (Monitor de Sitemaps y estado de lectura).
 * 2. Aspectos de Búsqueda (Search Appearance: Eventos, Videos, Rich Results).
 * 3. YouTube Data API v3 (Métricas de Videos y Shorts incrustados en Indus3).
 * ============================================================================
 */
const TechnicalSeoReport = ({ siteUrl = 'sc-domain:indus3pro.com' }) => {
  // Rango de fechas por defecto: últimos 28 días
  const getInitialDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 28);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDates());
  const [activePreset, setActivePreset] = useState('28d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingSitemap, setSubmittingSitemap] = useState(false);
  const [sitemapNotice, setSitemapNotice] = useState('');

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const formatDateDisplay = (isoStr) => {
    if (!isoStr) return 'No registrado';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch (e) {
      return isoStr;
    }
  };

  const getAdminToken = () => {
    return (
      (typeof window !== 'undefined' && sessionStorage.getItem('indus3_admin_token')) ||
      import.meta.env.PUBLIC_BACKEND_AUTH_KEY ||
      ''
    );
  };

  const fetchTechnicalData = async (sDate = dateRange.start, eDate = dateRange.end) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.indus3pro.com/seo/get_technical_seo.php?site_url=${encodeURIComponent(siteUrl)}&start_date=${sDate}&end_date=${eDate}&t=${Date.now()}`,
        {
          headers: {
            'Authorization': `Bearer ${getAdminToken()}`
          }
        }
      );

      if (!res.ok) {
        throw new Error(`El servidor respondió con código HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.message || 'Error reportado por el backend al consultar Search Console.');
      }
    } catch (e) {
      setError(`Error de conexión con el backend: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicalData(dateRange.start, dateRange.end);
  }, [siteUrl]);

  const applyPreset = (days, key) => {
    setActivePreset(key);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const newDates = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
    setDateRange(newDates);
    fetchTechnicalData(newDates.start, newDates.end);
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    setActivePreset('custom');
    fetchTechnicalData(dateRange.start, dateRange.end);
  };

  const handleSubmitSitemap = async (feedpath) => {
    setSubmittingSitemap(true);
    setSitemapNotice('');
    try {
      const res = await fetch(`https://api.indus3pro.com/seo/get_technical_seo.php?action=submit_sitemap&feedpath=${encodeURIComponent(feedpath)}`, {
        headers: {
          'Authorization': `Bearer ${getAdminToken()}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setSitemapNotice(`✓ Sitemap ${feedpath} notificado correctamente a Google.`);
        fetchTechnicalData(dateRange.start, dateRange.end);
      } else {
        setSitemapNotice(`⚠️ ${json.message || 'Error al notificar sitemap.'}`);
      }
    } catch (e) {
      setSitemapNotice(`Error de conexión al enviar sitemap: ${e.message}`);
    } finally {
      setSubmittingSitemap(false);
    }
  };

  const sitemapsList = data?.sitemaps?.sitemaps || [];
  const appearanceList = data?.search_appearance || [];
  const ytData = data?.youtube || {};
  const ytSummary = ytData.summary || {};
  const ytVideos = ytData.videos || [];
  const authStatus = data?.auth_status || {};

  return (
    <div className={styles.technicalContainer}>

      {/* Encabezado del Reporte */}
      <div className={styles.techHeader}>
        <div>
          <h2 className={styles.techTitle}>
            <span>🛠️ Reporte SEO Técnico & Funciones Avanzadas</span>
          </h2>
          <p className={styles.techSub}>
            Auditoría de infraestructura en tiempo real: Sitemaps XML, Rich Snippets (Search Appearance) y métricas de YouTube.
          </p>
        </div>
        <button
          type="button"
          className={styles.printBtn}
          onClick={() => window.print()}
          title="Imprimir informe técnico en PDF"
        >
          <span>🖨️</span> Imprimir Reporte Técnico
        </button>
      </div>

      {/* Barra de Selección de Período de Fecha */}
      <div className={styles.datePickerBar}>
        <div className={styles.datePresets}>
          <button
            type="button"
            className={`${styles.presetBtn} ${activePreset === '28d' ? styles.presetBtnActive : ''}`}
            onClick={() => applyPreset(28, '28d')}
          >
            Últimos 28 días
          </button>
          <button
            type="button"
            className={`${styles.presetBtn} ${activePreset === '3m' ? styles.presetBtnActive : ''}`}
            onClick={() => applyPreset(90, '3m')}
          >
            Últimos 3 meses
          </button>
          <button
            type="button"
            className={`${styles.presetBtn} ${activePreset === '6m' ? styles.presetBtnActive : ''}`}
            onClick={() => applyPreset(180, '6m')}
          >
            Últimos 6 meses
          </button>
          <button
            type="button"
            className={`${styles.presetBtn} ${activePreset === '1y' ? styles.presetBtnActive : ''}`}
            onClick={() => applyPreset(365, '1y')}
          >
            Último año
          </button>
        </div>

        <form onSubmit={handleCustomDateSubmit} className={styles.dateInputsRow}>
          <div className={styles.dateInputGroup}>
            <label>Desde:</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className={styles.dateInputGroup}>
            <label>Hasta:</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <button type="submit" className={styles.refreshBtn} disabled={loading}>
            {loading ? 'Consultando...' : '🔄 Actualizar'}
          </button>
        </form>
      </div>

      {/* Alerta de Error si la consulta falló */}
      {error && (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>
            <span>⚠️</span>
            <span>Error al obtener datos reales de Google Search Console</span>
          </div>
          <div className={styles.errorDetails}>{error}</div>
          <div className={styles.emptyStateAdvice}>
            <strong>💡 Consejo para resolver este problema:</strong>
            <ul>
              <li>Verifica que el archivo de credenciales de Google Service Account esté presente en el servidor (<code>apiIndus3/seo/service-account-key.json</code>).</li>
              <li>Asegúrate de que la cuenta de servicio de Google esté agregada como usuario con permisos en Google Search Console para la propiedad <code>{siteUrl}</code>.</li>
              <li>Revisa que el servidor PHP tenga habilitada la extensión <code>curl</code> y <code>openssl</code>.</li>
            </ul>
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => fetchTechnicalData(dateRange.start, dateRange.end)}
            style={{ width: 'fit-content' }}
          >
            🔄 Reintentar conexión
          </button>
        </div>
      )}

      {/* Indicador de carga */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
          <p style={{ fontSize: '1.05rem' }}>⏳ Consultando datos técnicos en Google Search Console para el período {dateRange.start} al {dateRange.end}...</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* =======================================================================
              MÓDULO 1: GOOGLE SITEMAPS MANAGEMENT
              ======================================================================= */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <span>🗺️ Google Sitemaps Management (Monitor de Sitemaps)</span>
                </h3>
                <span className={styles.sectionDesc}>
                  Supervisión de archivos XML registrados en Googlebot y recuento de URLs enviadas.
                </span>
              </div>
              <span className={sitemapsList.length > 0 ? styles.badgeOk : styles.badgeError}>
                {sitemapsList.length > 0 ? `${sitemapsList.length} Sitemap(s) activo(s)` : 'Sin Sitemaps registrados'}
              </span>
            </div>

            {sitemapNotice && (
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#93c5fd', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                {sitemapNotice}
              </div>
            )}

            {sitemapsList.length === 0 ? (
              <div className={styles.emptyStateBox}>
                <div className={styles.emptyStateIcon}>🗺️</div>
                <div className={styles.emptyStateContent}>
                  <h4>No se encontraron sitemaps registrados en Google Search Console</h4>
                  <p>
                    Actualmente la API de Google Search Console no devuelve sitemaps para la propiedad <code>{siteUrl}</code>.
                  </p>
                  <div className={styles.emptyStateAdvice}>
                    <strong>💡 Consejo para registrarlo:</strong>
                    <ol>
                      <li>El sitemap principal generado por Astro en tu sitio es: <code>https://indus3pro.com/sitemap-index.xml</code>.</li>
                      <li>Haz clic en el botón <strong>"Enviar sitemap oficial ahora"</strong> para que el backend lo notifique a la API de Google.</li>
                      <li>También puedes acceder a <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Google Search Console</a> en el menú lateral <strong>Sitemaps</strong> y agregar <code>sitemap-index.xml</code>.</li>
                    </ol>
                  </div>
                  <button
                    type="button"
                    className={styles.submitSitemapBtn}
                    onClick={() => handleSubmitSitemap('https://indus3pro.com/sitemap-index.xml')}
                    disabled={submittingSitemap}
                    style={{ marginTop: '0.85rem' }}
                  >
                    {submittingSitemap ? 'Enviando sitemap...' : '🚀 Enviar sitemap oficial ahora'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.sitemapHealthGrid}>
                  <div className={styles.sitemapHealthCard}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Sitemaps Monitoreados
                    </span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                      {sitemapsList.length}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Archivos registrados en Google</span>
                  </div>

                  <div className={styles.sitemapHealthCard}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      URLs Enviadas a Google
                    </span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4ade80', marginTop: '0.2rem' }}>
                      {sitemapsList.reduce((acc, sm) => acc + (sm.urls_submitted || 0), 0)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Procesadas por Googlebot</span>
                  </div>

                  <div className={styles.sitemapHealthCard}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Errores de Rastreo
                    </span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                      {sitemapsList.reduce((acc, sm) => acc + (sm.errors || 0), 0)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                      {sitemapsList.some(sm => sm.errors > 0) ? 'Requiere revisión' : 'Sitemaps limpios y válidos'}
                    </span>
                  </div>
                </div>

                <table className={styles.sitemapTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Ruta del Sitemap</th>
                      <th>Última Descarga Googlebot</th>
                      <th>URLs Enviadas</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sitemapsList.map((sm) => (
                      <tr key={sm.path}>
                        <td style={{ fontWeight: 600, color: '#f1f5f9' }}>
                          <a href={sm.path} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                            {sm.path}
                          </a>
                        </td>
                        <td style={{ color: '#cbd5e1' }}>{formatDateDisplay(sm.last_downloaded)}</td>
                        <td style={{ fontWeight: 700, color: '#4ade80' }}>{formatNumber(sm.urls_submitted)}</td>
                        <td>
                          <span className={sm.errors > 0 ? styles.badgeError : styles.badgeOk}>
                            {sm.errors > 0 ? `✕ ${sm.errors} Errores` : '✓ Correcto'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={styles.submitSitemapBtn}
                            onClick={() => handleSubmitSitemap(sm.path)}
                            disabled={submittingSitemap}
                          >
                            {submittingSitemap ? 'Enviando...' : 'Reenviar a Google'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* =======================================================================
              MÓDULO 2: ASPECTOS DE BÚSQUEDA (SEARCH APPEARANCE / RICH RESULTS)
              ======================================================================= */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <span>✨ Aspectos de Búsqueda de Google (Search Appearance)</span>
                </h3>
                <span className={styles.sectionDesc}>
                  Impacto de formatos enriquecidos (Rich Results) entre {dateRange.start} y {dateRange.end}.
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600 }}>
                {appearanceList.length} aspecto(s) detectado(s)
              </span>
            </div>

            <div className={styles.explainerBanner}>
              <div className={styles.explainerIcon}>💡</div>
              <div className={styles.explainerText}>
                <strong>¿Qué son los Aspectos de Búsqueda (Search Appearance)?</strong>
                <p>
                  Son los <strong>formatos visuales interactivos (Rich Results)</strong> que Google Search muestra a los usuarios cuando una página web tiene microdatos semánticos válidos (Schema.org).
                </p>
                <p>
                  En lugar de un simple enlace azul, Google premia a Indus3 mostrando carruseles con fechas de conciertos, miniaturas destacadas con botón 'Play' para videos y prioridad de velocidad para dispositivos móviles.
                </p>
              </div>
            </div>

            {appearanceList.length === 0 ? (
              <div className={styles.emptyStateBox}>
                <div className={styles.emptyStateIcon}>✨</div>
                <div className={styles.emptyStateContent}>
                  <h4>No se registraron aspectos enriquecidos en Google para el período seleccionado</h4>
                  <p>
                    Google Search Console no registró clics ni impresiones de formatos especiales (Rich Results) entre el <strong>{dateRange.start}</strong> y el <strong>{dateRange.end}</strong>.
                  </p>
                  <div className={styles.emptyStateAdvice}>
                    <strong>💡 Consejos para diagnosticar y activar resultados enriquecidos:</strong>
                    <ul>
                      <li><strong>Amplía el rango de fechas:</strong> Selecciona <strong>"Últimos 3 meses"</strong> o <strong>"Últimos 6 meses"</strong> en la barra superior. Si las búsquedas con formato enriquecido ocurrieron semanas atrás, aparecerán al ampliar el rango.</li>
                      <li><strong>Valida tus microdatos:</strong> Utiliza la herramienta oficial de Google: <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">Prueba de resultados enriquecidos</a> con una URL de eventos (ej. <code>https://indus3pro.com/eventos/sanluis/</code>). Debe detectar <code>Schema.org/Event</code> sin advertencias críticas.</li>
                      <li><strong>Indexación requerida:</strong> Para que Google muestre resultados enriquecidos, las URLs deben estar rastreadas e indexadas activamente en Googlebot.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.appearanceGrid}>
                {appearanceList.map((app) => (
                  <div key={app.appearance_key} className={styles.appearanceCard}>
                    <div className={styles.appearanceCardHeader}>
                      <span className={styles.appearanceIconBox}>{app.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div className={styles.appearanceTitleRow}>
                          <h4 className={styles.appearanceName}>{app.name}</h4>
                          {app.schema_type && (
                            <span className={styles.schemaBadge}>{app.schema_type}</span>
                          )}
                        </div>
                        <p className={styles.appearanceDesc}>{app.description}</p>
                      </div>
                    </div>

                    {app.how_it_appears && (
                      <div className={styles.howItAppearsBox}>
                        <span className={styles.howItAppearsLabel}>👁️ ¿Cómo aparece en Google?</span>
                        <p className={styles.howItAppearsText}>{app.how_it_appears}</p>
                      </div>
                    )}

                    {app.trigger_urls && app.trigger_urls.length > 0 && (
                      <div className={styles.triggerUrlsBox}>
                        <span className={styles.triggerUrlsLabel}>📍 Páginas de Indus3 que lo originan:</span>
                        <div className={styles.triggerUrlPills}>
                          {app.trigger_urls.map((u, idx) => (
                            <span key={idx} className={styles.triggerUrlPill}>{u}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.appearanceStatsRow}>
                      <div className={styles.appearanceMetric}>
                        <span className={styles.appearanceMetricLabel}>Clics</span>
                        <span className={styles.appearanceMetricVal} style={{ color: '#60a5fa' }}>
                          {formatNumber(app.clicks)}
                        </span>
                      </div>
                      <div className={styles.appearanceMetric}>
                        <span className={styles.appearanceMetricLabel}>Impresiones</span>
                        <span className={styles.appearanceMetricVal} style={{ color: '#c084fc' }}>
                          {formatNumber(app.impressions)}
                        </span>
                      </div>
                      <div className={styles.appearanceMetric}>
                        <span className={styles.appearanceMetricLabel}>CTR</span>
                        <span className={styles.appearanceMetricVal} style={{ color: '#34d399' }}>
                          {app.ctr}%
                        </span>
                      </div>
                      <div className={styles.appearanceMetric}>
                        <span className={styles.appearanceMetricLabel}>Posición</span>
                        <span className={styles.appearanceMetricVal} style={{ color: '#f59e0b' }}>
                          #{app.position}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =======================================================================
              MÓDULO 3: YOUTUBE DATA API V3 (VIDEOS Y SHORTS MUSICALES)
              ======================================================================= */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <span>🎬 YouTube Data API v3 (Métricas de Videos & Shorts)</span>
                </h3>
                <span className={styles.sectionDesc}>
                  Rendimiento real de los videos de YouTube incrustados en las publicaciones de Indus3.
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: ytVideos.length > 0 ? '#f87171' : '#94a3b8', fontWeight: 700 }}>
                {ytVideos.length > 0 ? `${ytVideos.length} Video(s) analizado(s)` : 'Sin videos vinculados'}
              </span>
            </div>

            <div className={styles.explainerBanner} style={{ borderLeftColor: '#ef4444' }}>
              <div className={styles.explainerIcon} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>🎬</div>
              <div className={styles.explainerText}>
                <strong>¿Cómo funciona el monitoreo de YouTube en Indus3?</strong>
                <p>
                  • <strong>¿Cómo se vincula?</strong>: El backend inspecciona tus artículos de <code>blog_posts</code> para extraer los IDs de YouTube asignados en el campo <code>video</code> o en el contenido del editor, y consulta sus estadísticas públicas en tiempo real.
                </p>
                <p>
                  • <strong>Consumo de cuota</strong>: Google asigna 10.000 unidades de cuota gratuitas diarias (reseteadas cada medianoche). Una consulta de videos consume 1 unidad, garantizando funcionamiento 100% gratuito.
                </p>
              </div>
            </div>

            {data?.youtube?.notice && (
              <div style={{
                margin: '0.75rem 0',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                color: '#fef08a',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>ℹ️</span>
                <span>{data.youtube.notice}</span>
              </div>
            )}

            {ytVideos.length === 0 ? (
              <div className={styles.emptyStateBox}>
                <div className={styles.emptyStateIcon}>🎬</div>
                <div className={styles.emptyStateContent}>
                  <h4>No se detectaron videos de YouTube en las publicaciones del blog</h4>
                  <p>
                    Actualmente no hay artículos publicados en <code>blog_posts</code> que contengan un video o Short de YouTube registrado.
                  </p>
                  <div className={styles.emptyStateAdvice}>
                    <strong>💡 Consejo para vincular videos de YouTube a tus noticias:</strong>
                    <ul>
                      <li>Al crear o editar una noticia en el <strong>Administrador de Noticias & Blog</strong>, pega la URL de un video de YouTube (ej. <code>https://www.youtube.com/watch?v=...</code> o <code>https://youtube.com/shorts/...</code>) en el campo <strong>Video</strong> o mediante el botón de herramientas <strong>"YouTube"</strong>.</li>
                      <li>Las publicaciones que son de tipo <em>Modal</em> (noticias rápidas de video sin página completa de lectura) son excluidas de las URLs indexables del blog, pero si contienen un video válido se registrarán sus estadísticas aquí.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.ytKpiGrid}>
                  <div className={styles.ytKpiCard}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Reproducciones Totales
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f87171', marginTop: '0.2rem' }}>
                      {formatNumber(ytSummary.total_views || 0)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Vistas en videos vinculados</span>
                  </div>

                  <div className={styles.ytKpiCard}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Me Gusta (Likes)
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                      {formatNumber(ytSummary.total_likes || 0)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Interacciones positivas</span>
                  </div>

                  <div className={styles.ytKpiCard}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Comentarios
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                      {formatNumber(ytSummary.total_comments || 0)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Comunidad activa</span>
                  </div>

                  <div className={styles.ytKpiCard}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Formato de Contenido
                    </span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
                      <span style={{ color: '#ef4444' }}>{ytSummary.total_shorts || 0} Shorts</span> / {ytSummary.total_standard || 0} Videos
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Optimizados para consumo móvil</span>
                  </div>
                </div>

                <div className={styles.ytVideosGrid}>
                  {ytVideos.map((vid) => {
                    const isBlogModal = vid.is_modal || vid.is_blog_modal || !vid.associated_post_slug || vid.associated_post_slug.startsWith('video-') || vid.associated_post_title === vid.title || vid.associated_post_title === '/blog/';
                    const linkedTitle = isBlogModal ? '/blog/' : vid.associated_post_title;
                    const indus3Url = isBlogModal ? '/blog/' : `/blog/${vid.associated_post_slug}/`;

                    return (
                      <div key={vid.video_id} className={styles.ytVideoCard}>
                        <div className={styles.ytThumbWrapper}>
                          <img
                            src={vid.thumbnail}
                            alt={vid.title}
                            className={styles.ytThumb}
                            onError={(e) => {
                              e.target.src = `https://img.youtube.com/vi/${vid.video_id}/hqdefault.jpg`;
                            }}
                          />
                          {/* Badge de tipo de contenido: Short vs Video */}
                          <span className={vid.is_short ? styles.ytShortBadge : styles.ytTypeBadge}>
                            {vid.is_short ? '⚡ Short' : '🎬 Video'}
                          </span>
                          {/* Badge de duración exacta del video */}
                          <span className={styles.ytDurationBadge}>
                            {vid.duration_formatted && vid.duration_formatted !== 'N/D' ? `⏱️ ${vid.duration_formatted}` : (vid.is_short ? '⏱️ < 60s' : '⏱️ Video')}
                          </span>
                        </div>

                        <div className={styles.ytInfo}>
                          <div className={styles.ytFormatRow}>
                            <span className={vid.is_short ? styles.ytFormatShortPill : styles.ytFormatVideoPill}>
                              {vid.is_short ? '⚡ YouTube Short' : '🎬 YouTube Video'}
                            </span>
                            {vid.duration_formatted && vid.duration_formatted !== 'N/D' && (
                              <span className={styles.ytDurationPill}>
                                ⏱️ Duración: <strong>{vid.duration_formatted}</strong>
                              </span>
                            )}
                          </div>

                          <h4 className={styles.ytVideoTitle} title={vid.title}>
                            {vid.title}
                          </h4>

                          {linkedTitle && (
                            <div className={styles.ytPostLinked}>
                              <span>📰 Vinculado a:</span>
                              <strong>{linkedTitle}</strong>
                            </div>
                          )}

                          <div className={styles.ytActionBtnsRow}>
                            <a
                              href={vid.youtube_url || (vid.is_short ? `https://www.youtube.com/shorts/${vid.video_id}` : `https://www.youtube.com/watch?v=${vid.video_id}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.ytLinkBtn}
                              title="Abrir este video directamente en YouTube"
                            >
                              ▶️ Ver en YouTube ↗
                            </a>
                            <a
                              href={indus3Url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.indus3LinkBtn}
                              title={isBlogModal ? "Ver en Indus3 (/blog/)" : "Ver la nota en el blog de Indus3"}
                            >
                              🌐 Ver en Indus3 ↗
                            </a>
                          </div>

                          <div className={styles.ytMetricsRow}>
                            <div className={styles.ytMetricItem}>
                              <span>👁️</span> {formatNumber(vid.views)} vistas
                            </div>
                            <div className={styles.ytMetricItem}>
                              <span>👍</span> {formatNumber(vid.likes)}
                            </div>
                            <div className={styles.ytMetricItem}>
                              <span>💬</span> {formatNumber(vid.comments)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default TechnicalSeoReport;
