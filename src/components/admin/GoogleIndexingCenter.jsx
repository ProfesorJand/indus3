import React, { useState, useEffect } from 'react';
import styles from './css/GoogleIndexingCenter.module.css';

/**
 * ============================================================================
 * CENTRO OPERATIVO DE INDEXACIÓN EN GOOGLE & INSPECCIÓN DE URLS
 * ============================================================================
 * Permite a los administradores:
 * 1. Monitorear qué URLs de Indus3 están efectivamente indexadas en Google.
 * 2. Conocer la fecha del último rastreo de Googlebot (lastCrawlTime).
 * 3. Enviar notificaciones prioritarias a la Google Indexing API (URL_UPDATED).
 * 4. Inspeccionar el estado de cobertura de cualquier URL en tiempo real.
 * ============================================================================
 */
const GoogleIndexingCenter = () => {
  const [urls, setUrls] = useState([]);
  const [summary, setSummary] = useState({
    total_urls: 0,
    indexed_count: 0,
    not_indexed_count: 0,
    unknown_count: 0,
    indexed_pct: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [newUrlInput, setNewUrlInput] = useState('');
  const [newUrlTitle, setNewUrlTitle] = useState('');
  const [actionLoadingUrl, setActionLoadingUrl] = useState(null);
  const [batchProgress, setBatchProgress] = useState(null);
  const [notification, setNotification] = useState(null);

  const getAdminToken = () => {
    return (
      (typeof window !== 'undefined' && sessionStorage.getItem('indus3_admin_token')) ||
      import.meta.env.PUBLIC_BACKEND_AUTH_KEY ||
      ''
    );
  };

  const [fetchError, setFetchError] = useState(null);

  const fetchUrls = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`https://api.indus3pro.com/seo/indexing_manager.php?action=list&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${getAdminToken()}`
        }
      });
      if (!res.ok) {
        throw new Error(`El servidor respondió HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setUrls(data.urls || []);
        setSummary(data.summary || {});
      } else {
        setFetchError(data.message || 'Error al obtener la lista de URLs del servidor.');
        setUrls([]);
        setSummary({});
      }
    } catch (err) {
      setFetchError(`Error de conexión con el backend: ${err.message}. Verifica que api.indus3pro.com esté accesible.`);
      setUrls([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const formatDateDisplay = (isoStr) => {
    if (!isoStr) return 'Nunca';
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

  // Inspeccionar URL individual con Search Console URL Inspection API
  const handleInspectUrl = async (url) => {
    setActionLoadingUrl(`inspect_${url}`);
    setNotification(null);
    try {
      const res = await fetch(`https://api.indus3pro.com/seo/indexing_manager.php?action=inspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        setUrls(prev => prev.map(u => {
          if (u.url === url) {
            return {
              ...u,
              verdict: data.verdict,
              coverage_state: data.coverage_state,
              last_crawl_time: data.last_crawl_time,
              mobile_usable: data.mobile_usable,
              last_inspected_at: data.last_inspected_at
            };
          }
          return u;
        }));
        setNotification({
          type: data.verdict === 'PASS' ? 'success' : 'warning',
          message: `Inspección de ${url}: ${data.message || 'Completada.'}`
        });
      } else {
        setNotification({
          type: 'error',
          message: `Error al inspeccionar: ${data.message}`
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'No se pudo conectar con el servidor para inspeccionar la URL.'
      });
    } finally {
      setActionLoadingUrl(null);
    }
  };

  // Enviar a Google Indexing API (Indexación Instantánea)
  const handlePublishIndex = async (url) => {
    setActionLoadingUrl(`index_${url}`);
    setNotification(null);
    try {
      const res = await fetch(`https://api.indus3pro.com/seo/indexing_manager.php?action=publish_index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({ url, type: 'URL_UPDATED' })
      });
      const data = await res.json();
      if (data.success) {
        setUrls(prev => prev.map(u => {
          if (u.url === url) {
            return {
              ...u,
              last_indexing_request: data.notify_time || new Date().toISOString(),
              indexing_api_status: 'SUCCESS'
            };
          }
          return u;
        }));
        setNotification({
          type: 'success',
          message: `🚀 ${data.message || '¡URL notificada exitosamente a Googlebot!'}`
        });
      } else {
        setNotification({
          type: 'error',
          message: `Error en Indexing API: ${data.message}`
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Error de red al invocar la Google Indexing API.'
      });
    } finally {
      setActionLoadingUrl(null);
    }
  };

  // Agregar URL personalizada
  const handleAddCustomUrl = async (e) => {
    e.preventDefault();
    if (!newUrlInput.trim()) return;

    try {
      const res = await fetch(`https://api.indus3pro.com/seo/indexing_manager.php?action=add_custom_url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({
          url: newUrlInput.trim(),
          title: newUrlTitle.trim() || newUrlInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewUrlInput('');
        setNewUrlTitle('');
        fetchUrls();
      } else {
        alert(data.message || 'Error al agregar URL');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  // Eliminar URL personalizada
  const handleDeleteCustomUrl = async (url) => {
    if (!confirm(`¿Eliminar la URL "${url}" del monitoreo?`)) return;
    try {
      await fetch(`https://api.indus3pro.com/seo/indexing_manager.php?action=delete_custom_url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({ url })
      });
      fetchUrls();
    } catch (err) {}
  };

  // Indexar todo en lote
  const handleBatchIndex = async () => {
    const pendingList = urls.filter(u => u.verdict !== 'PASS');
    const targetList = pendingList.length > 0 ? pendingList : urls;

    if (!confirm(`¿Deseas enviar las ${targetList.length} URLs a la Google Indexing API?`)) return;

    setBatchProgress({ current: 0, total: targetList.length });
    for (let i = 0; i < targetList.length; i++) {
      setBatchProgress({ current: i + 1, total: targetList.length });
      await handlePublishIndex(targetList[i].url);
      await new Promise(r => setTimeout(r, 600)); // Respetar cuota de API
    }
    setBatchProgress(null);
  };

  // Filtrado y ordenamiento de URLs (ordenadas alfabéticamente por URL)
  const filteredUrls = urls
    .filter(u => {
      if (filterCategory !== 'ALL' && u.category !== filterCategory) return false;
      if (filterStatus === 'INDEXED' && u.verdict !== 'PASS') return false;
      if (filterStatus === 'NOT_INDEXED' && u.verdict === 'PASS') return false;
      if (filterStatus === 'UNKNOWN' && u.verdict !== 'UNKNOWN') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return u.title.toLowerCase().includes(q) || u.url.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => a.url.localeCompare(b.url));

  return (
    <div className={styles.indexingContainer}>

      {/* Encabezado Explicativo */}
      <div className={styles.headerBox}>
        <div className={styles.headerText}>
          <h3>
            <span>⚡ Google Indexing API & Monitoreo de URLs</span>
          </h3>
          <p>
            Herramienta operativa interna para acelerar la presencia de Indus3 en Google. Permite notificar en minutos a <strong>Googlebot</strong> cuando se publica o actualiza una noticia o concierto musical (mediante <code>URL_UPDATED</code>), y consultar en vivo el estado real de indexación.
          </p>
        </div>
        <div className={styles.apiStatusPill}>
          <span>●</span> Google Indexing API Conectada
        </div>
      </div>

      {/* Alerta de Notificación Temporal */}
      {notification && (
        <div
          className={styles.notificationBox}
          style={{
            borderColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : (notification.type === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.4)'),
            background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : (notification.type === 'warning' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)'),
            color: notification.type === 'error' ? '#fca5a5' : (notification.type === 'warning' ? '#fde047' : '#86efac')
          }}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Progreso en Lote */}
      {batchProgress && (
        <div style={{ background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.35)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#c4b5fd', marginBottom: '0.4rem', fontWeight: 600 }}>
            <span>Enviando lote a Google Indexing API...</span>
            <span>{batchProgress.current} de {batchProgress.total}</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%`, height: '100%', background: '#8b5cf6', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* Alerta de Error de Servidor o Conexión */}
      {fetchError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '0.95rem' }}>
            <span>⚠️</span> Error al consultar Google Indexing / Search Console
          </div>
          <div style={{ color: '#fca5a5', fontSize: '0.82rem', background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontFamily: 'monospace' }}>
            {fetchError}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.45 }}>
            💡 <strong>Consejos para resolverlo:</strong>
            <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
              <li>Verifica que el archivo <code>apiIndus3/seo/service-account-key.json</code> exista en tu servidor.</li>
              <li>Asegúrate de que la Google Service Account tenga permisos habilitados para la propiedad <code>sc-domain:indus3pro.com</code> en Google Search Console.</li>
              <li>Revisa que el archivo de base de datos MySQL (<code>apiIndus3/blog/db.php</code>) esté conectando correctamente.</li>
            </ul>
          </div>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={fetchUrls}
            style={{ width: 'fit-content', marginTop: '0.35rem' }}
          >
            🔄 Reintentar conexión
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas de Salud */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total URLs Rastreadas</span>
          <span className={styles.statValue}>{summary.total_urls || urls.length}</span>
          <span className={styles.statSub}>Páginas clave y noticias</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Indexadas en Google</span>
          <span className={styles.statValue} style={{ color: '#4ade80' }}>
            {summary.indexed_count || 0}
          </span>
          <span className={styles.statSub}>
            {summary.indexed_pct || 0}% de cobertura aprobada
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pendientes / Sin Indexar</span>
          <span className={styles.statValue} style={{ color: '#f87171' }}>
            {summary.not_indexed_count || 0}
          </span>
          <span className={styles.statSub}>Requieren solicitud de rastreo</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Sin Inspeccionar</span>
          <span className={styles.statValue} style={{ color: '#94a3b8' }}>
            {summary.unknown_count || 0}
          </span>
          <span className={styles.statSub}>Pulsa "Inspeccionar" para verificar</span>
        </div>
      </div>

      {/* Formulario de Agregar y Barra de Filtros */}
      <div className={styles.actionsBar}>
        <form onSubmit={handleAddCustomUrl} className={styles.addUrlRow}>
          <input
            type="url"
            className={styles.inputUrl}
            placeholder="Añadir URL personalizada: https://indus3pro.com/..."
            value={newUrlInput}
            onChange={(e) => setNewUrlInput(e.target.value)}
            required
          />
          <input
            type="text"
            className={styles.inputUrl}
            style={{ maxWidth: '240px' }}
            placeholder="Título o Etiqueta (opcional)"
            value={newUrlTitle}
            onChange={(e) => setNewUrlTitle(e.target.value)}
          />
          <button type="submit" className={styles.addBtn}>
            + Añadir al Monitoreo
          </button>
        </form>

        <div className={styles.filterAndBatchRow}>
          <div className={styles.filterGroup}>
            <input
              type="text"
              className={styles.inputUrl}
              style={{ width: '220px', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              placeholder="🔍 Filtrar por nombre o URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className={styles.selectFilter}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="Principal">Principal / Home</option>
              <option value="Eventos">Eventos & Conciertos</option>
              <option value="Biografías">Biografías de Artistas</option>
              <option value="Spotify">Top Spotify</option>
              <option value="Servicios">Servicios</option>
              <option value="Blog">Noticias Blog</option>
              <option value="Guías">Guías</option>
              <option value="Personalizada">Personalizadas</option>
            </select>
            <select
              className={styles.selectFilter}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="INDEXED">Indexadas (PASS)</option>
              <option value="NOT_INDEXED">No Indexadas / Pendientes</option>
              <option value="UNKNOWN">Sin Inspeccionar</option>
            </select>
          </div>

          <div className={styles.batchBtns}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={fetchUrls}
              disabled={loading}
              title="Recargar lista"
            >
              🔄 Refrescar
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleBatchIndex}
              disabled={batchProgress !== null || urls.length === 0}
              title="Enviar lote a Google Indexing API"
            >
              <span>⚡</span> Indexar Lote en Google
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Monitoreo de URLs */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffffff', fontWeight: 700 }}>
            Listado de Páginas Monitoreadas ({filteredUrls.length})
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Haz clic en <strong>⚡ Indexar</strong> para forzar la visita de Googlebot en minutos
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.urlTable}>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Página / Título</th>
                <th>Categoría</th>
                <th>Estado en Google</th>
                <th>Último Rastreo Googlebot</th>
                <th>Última Indexación Solicitada</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Cargando listado de URLs...
                  </td>
                </tr>
              ) : filteredUrls.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No se encontraron URLs con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUrls.map((item) => {
                  const isInspectLoading = actionLoadingUrl === `inspect_${item.url}`;
                  const isIndexLoading = actionLoadingUrl === `index_${item.url}`;

                  return (
                    <tr key={item.url}>
                      <td className={styles.urlInfoCol}>
                        <span className={styles.urlTitle}>{item.title}</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.urlLink}
                        >
                          {item.url}
                        </a>
                      </td>

                      <td>
                        <span className={styles.catBadge}>{item.category}</span>
                      </td>

                      <td>
                        {item.verdict === 'PASS' ? (
                          <span className={styles.statusBadgePass} title={item.coverage_state}>
                            <span>✓</span> Indexada en Google
                          </span>
                        ) : item.verdict === 'NEUTRAL' ? (
                          <span className={styles.statusBadgeNeutral} title={item.coverage_state}>
                            <span>⏳</span> Sin indexar ({item.coverage_state || 'Descubierta'})
                          </span>
                        ) : item.verdict === 'FAIL' ? (
                          <span className={styles.statusBadgeFail} title={item.coverage_state}>
                            <span>✕</span> Error / Excluida
                          </span>
                        ) : (
                          <span className={styles.statusBadgeUnknown}>
                            <span>?</span> Sin inspeccionar
                          </span>
                        )}
                      </td>

                      <td style={{ color: item.last_crawl_time ? '#e2e8f0' : '#64748b' }}>
                        {formatDateDisplay(item.last_crawl_time)}
                      </td>

                      <td style={{ color: item.last_indexing_request ? '#c084fc' : '#64748b', fontWeight: item.last_indexing_request ? 600 : 400 }}>
                        {item.last_indexing_request ? (
                          <span>⚡ {formatDateDisplay(item.last_indexing_request)}</span>
                        ) : (
                          'No enviada'
                        )}
                      </td>

                      <td>
                        <div className={styles.actionCell} style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className={styles.actionBtnInspect}
                            onClick={() => handleInspectUrl(item.url)}
                            disabled={isInspectLoading || isIndexLoading}
                            title="Consultar en vivo con Search Console URL Inspection API"
                          >
                            {isInspectLoading ? '...' : '🔍 Inspeccionar'}
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtnIndex}
                            onClick={() => handlePublishIndex(item.url)}
                            disabled={isInspectLoading || isIndexLoading}
                            title="Enviar notificación a Google Indexing API para rastreo instantáneo"
                          >
                            {isIndexLoading ? 'Enviando...' : '⚡ Indexar'}
                          </button>

                          {item.is_custom && (
                            <button
                              type="button"
                              className={styles.actionBtnDelete}
                              onClick={() => handleDeleteCustomUrl(item.url)}
                              title="Eliminar del monitoreo"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default GoogleIndexingCenter;

