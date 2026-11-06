import React, { useState, useEffect, useRef } from 'react';
import styles from './css/SearchConsoleReports.module.css';
import SearchConsoleReportDoc from './SearchConsoleReportDoc';
import GoogleIndexingCenter from './GoogleIndexingCenter';
import TechnicalSeoReport from './TechnicalSeoReport';

/**
 * ============================================================================
 * COMPONENTE REPORTES GOOGLE SEARCH CONSOLE & IA - INDUS3 ADMIN
 * ============================================================================
 * Permite generar reportes mensuales y bajo demanda con:
 * - KPIs de Clics Totales e Impresiones Totales con desglose por dispositivos (móvil, ordenador, tablet).
 * - Gráfico lineal interactivo de Clics e Impresiones con eje X y tooltips dinámicos.
 * - Pestañas de "Más Clics", "Al Alza" y "A la Baja" en Páginas y Keywords (Top 10).
 * - Selector de personalización de informe: Activar/desactivar qué mostrar (CTR, Posición, etc.).
 * - Sección dedicada de Rendimiento en IA Generativa de Google (AI Overviews & Modo IA):
 *   impresiones, gráfico de IA, y pestañas de Páginas, Países y Dispositivos de IA.
 * - Tráfico referido directamente por Inteligencias Artificiales (ChatGPT, Perplexity, etc.).
 * - Exportación a PDF / Impresión limpia sin elementos de interfaz ni cortes extraños.
 */

/**
 * Parser liviano de archivos CSV de Google Search Console
 * Soporta delimitadores por coma, punto y coma, o tabulación, con y sin comillas.
 */
const parseGscCsvText = (text) => {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headerLine = lines[0];
  let delimiter = ',';
  if (headerLine.includes(';') && (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length) {
    delimiter = ';';
  } else if (headerLine.includes('\t')) {
    delimiter = '\t';
  }

  const parseLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    values.push(current.trim());
    return values.map((v) => v.replace(/^"|"$/g, '').trim());
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
};

const SearchConsoleReports = () => {
  // Pestaña principal de navegación: 'executive' (Jefes) | 'indexing' (Google Indexing API) | 'technical' (SEO Técnico)
  const [activeMainTab, setActiveMainTab] = useState('executive');

  // Estado de período seleccionado
  const [periodPreset, setPeriodPreset] = useState('last_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [siteUrl, setSiteUrl] = useState('sc-domain:indus3pro.com');

  // Estados de datos
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [needsCredentials, setNeedsCredentials] = useState(false);

  // Estados de importación oficial de CSVs de IA Generativa de Search Console
  const [importedAiData, setImportedAiData] = useState(null);
  const [importNotice, setImportNotice] = useState('');
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const csvFileInputRef = useRef(null);

  // Estados de personalización de informe (qué mostrar / qué ocultar a los jefes)
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    showClicks: true,
    showImpressions: true,
    showCtr: false, // Oculto por defecto para jefes
    showPosition: false, // Oculto por defecto para jefes
    showChart: true,
    showSections: true, // NUEVO: Rendimiento por Secciones de Indus3
    showChannels: true, // NUEVO: Canales de Búsqueda (Web vs Imágenes vs Noticias vs Discover)
    showAiGenerative: true,
    showPages: true,
    showQueries: true,
    showCountries: true,
  });

  // Modal de credenciales
  const [modalOpen, setModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsStatus, setCredsStatus] = useState(null);

  const getAdminToken = () => {
    return (
      (typeof window !== 'undefined' && sessionStorage.getItem('indus3_admin_token')) ||
      import.meta.env.PUBLIC_BACKEND_AUTH_KEY ||
      ''
    );
  };

  // Helper para calcular fechas predeterminadas
  const computePresetDates = (preset) => {
    const today = new Date();
    const gscLagDays = 3;
    const latestAvailable = new Date(today);
    latestAvailable.setDate(today.getDate() - gscLagDays);

    const formatYMD = (d) => d.toISOString().split('T')[0];

    if (preset === 'last_month') {
      const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start: formatYMD(firstDayPrevMonth),
        end: formatYMD(lastDayPrevMonth)
      };
    } else if (preset === 'last_28_days') {
      const end = new Date(latestAvailable);
      const start = new Date(latestAvailable);
      start.setDate(end.getDate() - 27);
      return { start: formatYMD(start), end: formatYMD(end) };
    } else if (preset === 'last_7_days') {
      const end = new Date(latestAvailable);
      const start = new Date(latestAvailable);
      start.setDate(end.getDate() - 6);
      return { start: formatYMD(start), end: formatYMD(end) };
    } else if (preset === 'last_3_months') {
      const end = new Date(latestAvailable);
      const start = new Date(latestAvailable);
      start.setDate(end.getDate() - 89);
      return { start: formatYMD(start), end: formatYMD(end) };
    }

    return { start: startDate, end: endDate };
  };

  // Inicializar fechas al montar
  useEffect(() => {
    const initialDates = computePresetDates('last_month');
    setStartDate(initialDates.start);
    setEndDate(initialDates.end);
    checkCredentialsStatus();
  }, []);

  // Verificar si las credenciales ya están configuradas en el servidor
  const checkCredentialsStatus = async () => {
    try {
      const res = await fetch('https://api.indus3pro.com/seo/save_credentials.php?action=status', {
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      const data = await res.json();
      setCredsStatus(data);
      if (data.configured) {
        setNeedsCredentials(false);
      } else {
        setNeedsCredentials(true);
      }
    } catch (e) {
      console.log('No se pudo verificar estado de credenciales de GSC');
    }
  };

  // Cambiar preset de período
  const handleSelectPreset = (preset) => {
    setPeriodPreset(preset);
    if (preset !== 'custom') {
      const dates = computePresetDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  };

  // Consultar reporte a la API bajo demanda
  const handleFetchReport = async (e) => {
    if (e) e.preventDefault();
    if (!startDate || !endDate) {
      alert('Por favor selecciona las fechas de inicio y fin.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const url = `https://api.indus3pro.com/seo/get_report.php?start_date=${startDate}&end_date=${endDate}&site_url=${encodeURIComponent(siteUrl)}&t=${Date.now()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getAdminToken()}`
        }
      });
      const data = await res.json();

      if (data.success) {
        setReport(data);
        setNeedsCredentials(false);
      } else {
        if (data.needs_credentials) {
          setNeedsCredentials(true);
        }
        setErrorMsg(data.message || 'Error al obtener el reporte de Search Console.');
      }
    } catch (err) {
      setErrorMsg('No se pudo conectar con el servidor backend (api.indus3pro.com).');
    } finally {
      setLoading(false);
    }
  };

  // Guardar credenciales de GCP Service Account
  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;

    setSavingCreds(true);
    try {
      const res = await fetch('https://api.indus3pro.com/seo/save_credentials.php?action=save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({ credentials_json: jsonInput.trim() })
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message || '¡Credenciales guardadas y verificadas con éxito!');
        setModalOpen(false);
        setJsonInput('');
        setNeedsCredentials(false);
        checkCredentialsStatus();
        handleFetchReport();
      } else {
        alert(data.message || 'Error al validar las credenciales de Google.');
      }
    } catch (err) {
      alert('Error de conexión al guardar las credenciales.');
    } finally {
      setSavingCreds(false);
    }
  };

  // Imprimir / Exportar reporte a PDF
  const handlePrint = () => {
    window.print();
  };

  // Intentar cargar datos CSV previos guardados para el rango de fechas seleccionado o el más reciente
  useEffect(() => {
    try {
      const keyByDate = (startDate && endDate) ? `indus3_gsc_ai_${startDate}_${endDate}` : null;
      const savedByDate = keyByDate ? localStorage.getItem(keyByDate) : null;
      const savedLatest = localStorage.getItem('indus3_gsc_ai_latest');
      const saved = savedByDate || savedLatest;
      if (saved) {
        const parsed = JSON.parse(saved);
        setImportedAiData(parsed);
      }
    } catch (e) {}
  }, [startDate, endDate]);

  // Procesar archivos CSV de IA Generativa de Search Console
  const handleCsvFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList);
    setImportNotice('Procesando archivos CSV...');

    const newAiData = {
      is_official_import: true,
      imported_at: new Date().toISOString(),
      devices: [],
      top_countries: [],
      top_pages: [],
      timeline: [],
      files_loaded: [],
      period_from_filter: ''
    };

    let totalImpFromDevices = 0;
    let totalImpFromPages = 0;
    let totalImpFromTimeline = 0;
    let totalImpFromCountries = 0;

    const normalizeText = (s) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    for (const file of files) {
      try {
        const text = await file.text();
        const { headers, rows } = parseGscCsvText(text);
        if (rows.length === 0) continue;

        const fileNameClean = normalizeText(file.name);
        const headerClean = normalizeText(headers.join(' '));

        // 1. Dispositivos.csv
        if (fileNameClean.includes('dispositivo') || fileNameClean.includes('device') || headerClean.includes('dispositivo') || headerClean.includes('device')) {
          const deviceMap = {
            moviles: { name: 'Móviles', icon: '📱', device: 'mobile' },
            movil: { name: 'Móviles', icon: '📱', device: 'mobile' },
            mobile: { name: 'Móviles', icon: '📱', device: 'mobile' },
            ordenador: { name: 'PC', icon: '💻', device: 'desktop' },
            ordenadores: { name: 'PC', icon: '💻', device: 'desktop' },
            desktop: { name: 'PC', icon: '💻', device: 'desktop' },
            computadora: { name: 'PC', icon: '💻', device: 'desktop' },
            tablet: { name: 'Tablets', icon: '📟', device: 'tablet' },
            tablets: { name: 'Tablets', icon: '📟', device: 'tablet' },
            tableta: { name: 'Tablets', icon: '📟', device: 'tablet' }
          };

          const devs = [];
          let sumImp = 0;
          rows.forEach((r) => {
            const rawName = (r[0] || '').trim();
            const rawImp = (r[1] || '').trim();
            const imp = parseInt(rawImp.replace(/[^0-9]/g, ''), 10) || 0;
            sumImp += imp;

            const key = normalizeText(rawName);
            const matched = deviceMap[key] || { name: rawName, icon: '🖥️', device: key };
            devs.push({
              device: matched.device,
              name: matched.name,
              icon: matched.icon,
              impressions: imp,
              share_pct: 0
            });
          });

          devs.forEach((d) => {
            d.share_pct = sumImp > 0 ? parseFloat(((d.impressions / sumImp) * 100).toFixed(1)) : 0;
          });

          totalImpFromDevices = sumImp;
          newAiData.devices = devs;
          newAiData.files_loaded.push(`Dispositivos (${devs.length})`);
        }

        // 2. Países.csv
        else if (fileNameClean.includes('pais') || fileNameClean.includes('countr') || headerClean.includes('pais') || headerClean.includes('country')) {
          let sumImp = 0;
          const countries = rows.map((r) => {
            const rawCountry = (r[0] || '').trim();
            const rawImp = (r[1] || '').trim();
            const imp = parseInt(rawImp.replace(/[^0-9]/g, ''), 10) || 0;
            sumImp += imp;
            return {
              country_code: rawCountry,
              country_name: rawCountry,
              impressions: imp,
              share_pct: 0
            };
          }).filter((c) => c.country_name);

          countries.forEach((c) => {
            c.share_pct = sumImp > 0 ? parseFloat(((c.impressions / sumImp) * 100).toFixed(1)) : 0;
          });

          countries.sort((a, b) => b.impressions - a.impressions);
          totalImpFromCountries = sumImp;
          newAiData.top_countries = countries;
          newAiData.files_loaded.push(`Países (${countries.length})`);
        }

        // 3. Páginas.csv
        else if (fileNameClean.includes('pagina') || fileNameClean.includes('page') || headerClean.includes('pagina') || headerClean.includes('page')) {
          let sumImp = 0;
          const pages = rows.map((r) => {
            const rawPage = (r[0] || '').trim();
            const rawImp = (r[1] || '').trim();
            const imp = parseInt(rawImp.replace(/[^0-9]/g, ''), 10) || 0;
            sumImp += imp;
            return {
              page: rawPage,
              clean_path: rawPage.replace(/^https?:\/\/[^\/]+/, '') || '/',
              impressions: imp,
              position: '-'
            };
          }).filter((p) => p.page);

          pages.sort((a, b) => b.impressions - a.impressions);
          totalImpFromPages = sumImp;
          newAiData.top_pages = pages;
          newAiData.files_loaded.push(`Páginas (${pages.length})`);
        }

        // 4. Gráfico.csv / Fecha.csv
        else if (fileNameClean.includes('grafico') || fileNameClean.includes('chart') || fileNameClean.includes('fecha') || fileNameClean.includes('date') || headerClean.includes('fecha') || headerClean.includes('date')) {
          let sumImp = 0;
          const timeline = rows.map((r) => {
            const rawDate = (r[0] || '').trim();
            const rawImp = (r[1] || '').trim();
            const imp = parseInt(rawImp.replace(/[^0-9]/g, ''), 10) || 0;
            sumImp += imp;
            return {
              date: rawDate,
              impressions: imp
            };
          }).filter((t) => t.date);

          timeline.sort((a, b) => a.date.localeCompare(b.date));
          totalImpFromTimeline = sumImp;
          newAiData.timeline = timeline;
          newAiData.files_loaded.push(`Gráfico (${timeline.length} días)`);
        }

        // 5. Filtros.csv
        else if (fileNameClean.includes('filtro') || fileNameClean.includes('filter')) {
          let periodVal = '';
          rows.forEach((r) => {
            const label = normalizeText(r[0]);
            if (label.includes('fecha') || label.includes('date')) {
              periodVal = (r[1] || '').trim();
            }
          });
          newAiData.period_from_filter = periodVal;
          newAiData.files_loaded.push(`Filtros (${periodVal || 'Detectado'})`);
        }
      } catch (err) {
        console.error('Error al procesar archivo CSV:', file.name, err);
      }
    }

    const finalTotalImp = totalImpFromDevices || totalImpFromTimeline || totalImpFromCountries || totalImpFromPages || 0;
    newAiData.total_impressions = finalTotalImp;

    if (newAiData.files_loaded.length > 0) {
      setImportedAiData(newAiData);
      setImportNotice(`✓ ¡Cargado con éxito! ${newAiData.files_loaded.join(', ')}. Impresiones oficiales: ${finalTotalImp.toLocaleString('es-ES')}`);
      // Activar automáticamente la sección de IA Generativa en el informe
      setReportOptions((prev) => ({ ...prev, showAiGenerative: true }));
      try {
        if (startDate && endDate) {
          localStorage.setItem(`indus3_gsc_ai_${startDate}_${endDate}`, JSON.stringify(newAiData));
        }
        localStorage.setItem('indus3_gsc_ai_latest', JSON.stringify(newAiData));
      } catch (e) {}
    } else {
      setImportNotice('No se reconocieron columnas compatibles en los CSV cargados.');
    }
  };

  const handleResetCsvData = () => {
    setImportedAiData(null);
    setImportNotice('');
    try {
      if (startDate && endDate) {
        localStorage.removeItem(`indus3_gsc_ai_${startDate}_${endDate}`);
      }
      localStorage.removeItem('indus3_gsc_ai_latest');
    } catch (e) {}
  };

  return (
    <div className={styles.container}>
      {/* Selector de Pestañas Principales (Oculto en PDF de impresión) */}
      <div className={`${styles.mainTabNav} no-print`}>
        <button
          type="button"
          className={`${styles.mainTabBtn} ${activeMainTab === 'executive' ? styles.mainTabBtnActive : ''}`}
          onClick={() => setActiveMainTab('executive')}
        >
          📊 Informe Ejecutivo SEO (Para Jefes)
        </button>
        <button
          type="button"
          className={`${styles.mainTabBtn} ${activeMainTab === 'indexing' ? styles.mainTabBtnActive : ''}`}
          onClick={() => setActiveMainTab('indexing')}
        >
          ⚡ Indexación en Vivo (Google Indexing API & URLs)
        </button>
        <button
          type="button"
          className={`${styles.mainTabBtn} ${activeMainTab === 'technical' ? styles.mainTabBtnActive : ''}`}
          onClick={() => setActiveMainTab('technical')}
        >
          🛠️ Reporte SEO Técnico
        </button>
      </div>

      {/* =======================================================================
          VISTA: CENTRO DE INDEXACIÓN EN VIVO (NO SE INCLUYE EN EL REPORTE DE JEFES)
          ======================================================================= */}
      {activeMainTab === 'indexing' && (
        <GoogleIndexingCenter />
      )}

      {/* =======================================================================
          VISTA: REPORTE SEO TÉCNICO (SITEMAPS, SEARCH APPEARANCE & YOUTUBE)
          ======================================================================= */}
      {activeMainTab === 'technical' && (
        <TechnicalSeoReport siteUrl={siteUrl} />
      )}

      {/* =======================================================================
          VISTA: INFORME EJECUTIVO SEO (PARA JEFES CON DESCARGA PDF)
          ======================================================================= */}
      {activeMainTab === 'executive' && (
        <>
          {/* 1. Header Card con Controles de Período y Botón de Generar */}
          <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitleBox}>
            <div className={styles.headerIcon}>📊</div>
            <div>
              <h2 className={styles.title}>Google Search Console & Estadísticas de IA</h2>
              <p className={styles.subtitle}>
                Reportes bajo demanda y mensuales para {siteUrl} comparados contra su período anterior.
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setShowCustomizer(!showCustomizer)}
              title="Elegir qué métricas y secciones mostrar u ocultar en el informe y PDF"
              style={{ borderColor: showCustomizer ? '#3b82f6' : 'rgba(255,255,255,0.15)' }}
            >
              🎨 Personalizar Informe {showCustomizer ? '▲' : '▼'}
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setModalOpen(true)}
              title="Configurar cuenta de Google Service Account"
            >
              ⚙️ Credenciales Google
            </button>
            {report && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handlePrint}
                title="Generar PDF o imprimir este reporte"
                style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6', color: '#60a5fa' }}
              >
                🖨️ Exportar / Imprimir PDF
              </button>
            )}
          </div>
        </div>

        {/* Barra de Período */}
        <div className={styles.controlsRow}>
          <div className={styles.presetsGroup}>
            <button
              type="button"
              className={`${styles.presetBtn} ${periodPreset === 'last_month' ? styles.presetBtnActive : ''}`}
              onClick={() => handleSelectPreset('last_month')}
            >
              📅 Mes Pasado
            </button>
            <button
              type="button"
              className={`${styles.presetBtn} ${periodPreset === 'last_28_days' ? styles.presetBtnActive : ''}`}
              onClick={() => handleSelectPreset('last_28_days')}
            >
              Últimos 28 días
            </button>
            <button
              type="button"
              className={`${styles.presetBtn} ${periodPreset === 'last_7_days' ? styles.presetBtnActive : ''}`}
              onClick={() => handleSelectPreset('last_7_days')}
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              className={`${styles.presetBtn} ${periodPreset === 'last_3_months' ? styles.presetBtnActive : ''}`}
              onClick={() => handleSelectPreset('last_3_months')}
            >
              Últimos 3 meses
            </button>
            <button
              type="button"
              className={`${styles.presetBtn} ${periodPreset === 'custom' ? styles.presetBtnActive : ''}`}
              onClick={() => setPeriodPreset('custom')}
            >
              🛠️ Personalizado
            </button>
          </div>

          {/* Fechas personalizadas */}
          <div className={styles.customDateGroup}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Desde:</span>
            <input
              type="date"
              className={styles.dateInput}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
            />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Hasta:</span>
            <input
              type="date"
              className={styles.dateInput}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
            />
          </div>

          <button
            type="button"
            className={styles.generateBtn}
            onClick={handleFetchReport}
            disabled={loading}
          >
            {loading ? '⏳ Consultando API...' : '🚀 Generar Reporte'}
          </button>
        </div>
      </div>

      {/* PANEL DE PERSONALIZACIÓN DEL INFORME (QUÉ MOSTRAR / QUÉ OCULTAR) */}
      {showCustomizer && (
        <div className={styles.customizerCard}>
          <div className={styles.customizerHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.15rem' }}>🎨</span>
              <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                Personalizar Contenido del Informe
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                (Marca o desmarca lo que deseas que aparezca en pantalla y en el PDF para los jefes)
              </span>
            </div>

            <div className={styles.customizerPresetBtns}>
              <button
                type="button"
                className={`${styles.quickModeBtn} ${!reportOptions.showCtr && !reportOptions.showPosition ? styles.quickModeBtnActive : ''}`}
                onClick={() => setReportOptions(prev => ({
                  ...prev,
                  showClicks: true,
                  showImpressions: true,
                  showCtr: false,
                  showPosition: false,
                  showChart: true,
                  showSections: true,
                  showChannels: true,
                  showAiGenerative: true,
                  showPages: true,
                  showQueries: true,
                  showCountries: true
                }))}
                title="Oculta el CTR y la Posición Media para que los jefes se enfoquen en Clics e Impresiones"
              >
                👔 Modo Ejecutivo (Para Jefes)
              </button>
              <button
                type="button"
                className={`${styles.quickModeBtn} ${reportOptions.showCtr && reportOptions.showPosition ? styles.quickModeBtnActive : ''}`}
                onClick={() => setReportOptions(prev => ({
                  ...prev,
                  showClicks: true,
                  showImpressions: true,
                  showCtr: true,
                  showPosition: true,
                  showChart: true,
                  showSections: true,
                  showChannels: true,
                  showAiGenerative: true,
                  showPages: true,
                  showQueries: true,
                  showCountries: true
                }))}
                title="Muestra todas las métricas detalladas incluyendo CTR y Posición Media"
              >
                🔬 Modo Completo (SEO Técnico)
              </button>
            </div>
          </div>

          <div className={styles.customizerGrid}>
            {/* Grupo 1: Métricas Principales */}
            <div className={styles.customizerGroup}>
              <span className={styles.customizerGroupTitle}>📊 Métricas (KPIs)</span>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showClicks}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showClicks: e.target.checked }))}
                />
                <span>Clics Totales</span>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showImpressions}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showImpressions: e.target.checked }))}
                />
                <span>Impresiones Totales</span>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showCtr}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showCtr: e.target.checked }))}
                />
                <span>CTR Promedio</span>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showPosition}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showPosition: e.target.checked }))}
                />
                <span>Posición Media</span>
              </label>
            </div>

            {/* Grupo 2: Gráficos y Secciones */}
            <div className={styles.customizerGroup}>
              <span className={styles.customizerGroupTitle}>📈 Gráficos y Secciones</span>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showSections}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showSections: e.target.checked }))}
                />
                <span>Rendimiento por Secciones</span>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showChart}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showChart: e.target.checked }))}
                />
                <span>Gráfico de Evolución Diaria</span>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showChannels}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showChannels: e.target.checked }))}
                />
                <span>Canales (Web vs Imágenes vs Noticias vs Discover)</span>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showAiGenerative}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showAiGenerative: e.target.checked }))}
                />
                <span>Informe IA Generativa (GSC)</span>
              </label>
            </div>

            {/* Grupo 3: Tablas */}
            <div className={styles.customizerGroup}>
              <span className={styles.customizerGroupTitle}>📋 Tablas (Top 17)</span>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showPages}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showPages: e.target.checked }))}
                />
                <span>Top 17 Páginas</span>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showQueries}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showQueries: e.target.checked }))}
                />
                <span>Top 17 Consultas (Keywords)</span>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={reportOptions.showCountries}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, showCountries: e.target.checked }))}
                />
                <span>Top 17 Países</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Alerta si faltan credenciales */}
      {needsCredentials && (
        <div className={styles.alertCard}>
          <div className={styles.alertText}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, color: '#fef08a' }}>Credenciales de Google requeridas</h4>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#fef9c3' }}>
                Para consultar Google Search Console API directamente desde el panel, necesitas configurar la clave JSON de tu cuenta de servicio de Google Cloud.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.generateBtn}
            onClick={() => setModalOpen(true)}
            style={{ padding: '0.5rem 1rem' }}
          >
            Configurar Ahora
          </button>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className={styles.alertCard} style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.12)' }}>
          <span style={{ fontSize: '1.4rem' }}>❌</span>
          <span style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{errorMsg}</span>
        </div>
      )}

      {/* IMPORTADOR DE ARCHIVOS CSV DE IA GENERATIVA DE SEARCH CONSOLE */}
      <div className={styles.csvImportBox}>
        <input
          type="file"
          ref={csvFileInputRef}
          multiple
          accept=".csv"
          onChange={(e) => handleCsvFiles(e.target.files)}
          style={{ display: 'none' }}
        />

        {importedAiData ? (
          <div className={styles.csvSuccessBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.6rem' }}>✨</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#86efac', fontSize: '0.92rem' }}>
                    ✓ Datos oficiales de IA Generativa vinculados al reporte
                  </strong>
                  <span className={styles.csvPill}>
                    {(importedAiData.total_impressions || 0).toLocaleString('es-ES')} Impresiones Oficiales
                  </span>
                  {importedAiData.period_from_filter && (
                    <span className={styles.csvPill} style={{ background: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#d8b4fe' }}>
                      Período: {importedAiData.period_from_filter}
                    </span>
                  )}
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Archivos cargados: {importedAiData.files_loaded?.join(' • ') || 'Dispositivos, Páginas, Países, Gráfico, Filtros'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => csvFileInputRef.current?.click()}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                title="Actualizar o subir nuevos archivos CSV"
              >
                🔄 Reemplazar CSVs
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleResetCsvData}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                title="Quitar estos datos de IA Generativa"
              >
                🗑️ Quitar
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`${styles.csvDropzone} ${isDraggingCsv ? styles.csvDropzoneActive : ''}`}
            onClick={() => csvFileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingCsv(true);
            }}
            onDragLeave={() => setIsDraggingCsv(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingCsv(false);
              if (e.dataTransfer?.files?.length > 0) {
                handleCsvFiles(e.dataTransfer.files);
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  🤖
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>
                      Insertar Archivos de IA Generativa (Search Console)
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                      Opcional • 5 CSVs
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Arrastra aquí o haz clic para seleccionar los 5 archivos exportados (<code>Dispositivos.csv</code>, <code>Filtros.csv</code>, <code>Gráfico.csv</code>, <code>Páginas.csv</code>, <code>Países.csv</code>).
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={styles.secondaryBtn}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', borderColor: '#a855f7', color: '#d8b4fe' }}
              >
                📁 Seleccionar Archivos
              </button>
            </div>

            {importNotice && (
              <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: importNotice.startsWith('✓') ? '#86efac' : '#fde047' }}>
                {importNotice}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REPORTE GENERADO EN COMPONENTE DEDICADO */}
      {report && (
        <SearchConsoleReportDoc
          report={report}
          reportOptions={reportOptions}
          importedAiData={importedAiData}
        />
      )}
        </>
      )}

      {/* Modal de Configuración de Credenciales */}
      {modalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>⚙️ Configurar Google Service Account</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {credsStatus?.configured ? (
              <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                <p style={{ margin: 0, color: '#4ade80', fontWeight: 600 }}>
                  ✓ Conexión con Google Search Console activa
                </p>
                <p style={{ margin: '0.25rem 0 0', color: '#cbd5e1', fontSize: '0.8rem' }}>
                  Cuenta de Servicio: <code>{credsStatus.client_email}</code><br />
                  Proyecto: <code>{credsStatus.project_id}</code>
                </p>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                Pega el contenido completo del archivo JSON de tu Service Account de Google Cloud (con permisos sobre la propiedad <code>sc-domain:indus3pro.com</code>).
              </p>
            )}

            <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}>
                  JSON de la clave (GCP_SERVICE_ACCOUNT_KEY):
                </label>
                <textarea
                  className={styles.modalTextarea}
                  placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..."}'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.generateBtn}
                  disabled={savingCreds}
                >
                  {savingCreds ? 'Guardando y Verificando...' : 'Guardar y Verificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchConsoleReports;
