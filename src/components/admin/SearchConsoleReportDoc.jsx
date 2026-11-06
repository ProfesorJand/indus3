import React, { useState, useRef } from 'react';
import styles from './css/SearchConsoleReportDoc.module.css';

// Diccionario de códigos de país a nombres en español
const countryNames = {
  ven: 'Venezuela',
  usa: 'Estados Unidos',
  col: 'Colombia',
  esp: 'España',
  mex: 'México',
  arg: 'Argentina',
  chlen: 'Chile',
  chl: 'Chile',
  per: 'Perú',
  ecu: 'Ecuador',
  pan: 'Panamá',
  cri: 'Costa Rica',
  dom: 'Rep. Dominicana',
  gtm: 'Guatemala',
  bra: 'Brasil',
  can: 'Canadá',
  fra: 'Francia',
  deu: 'Alemania',
  ita: 'Italia',
  gbr: 'Reino Unido',
  ury: 'Uruguay',
  bol: 'Bolivia',
  prt: 'Portugal',
};

const formatCountry = (code) => {
  if (!code) return 'Desconocido';
  const clean = code.toLowerCase();
  return countryNames[clean] || code.toUpperCase();
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('es-ES').format(num);
};

const formatDateNice = (ymd) => {
  if (!ymd) return '';
  const clean = String(ymd).split('T')[0].trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const mesIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${meses[mesIdx] || parts[1]}`;
  }
  return clean;
};

const formatDateFull = (ymd) => {
  if (!ymd) return '';
  const clean = String(ymd).split('T')[0].trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} de ${meses[mesIdx] || parts[1]} de ${parts[0]}`;
  }
  return clean;
};

/**
 * Formatea un rango de fechas con los meses en texto completo en español
 * Ejemplo: "1 al 31 de Octubre de 2026" o "15 de Septiembre al 15 de Octubre de 2026"
 */
const formatPeriodText = (start, end) => {
  if (!start || !end) return start || end || '';
  const sParts = String(start).split('-');
  const eParts = String(end).split('-');
  if (sParts.length !== 3 || eParts.length !== 3) return `${start} al ${end}`;

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const sDay = parseInt(sParts[2], 10);
  const sMonth = meses[parseInt(sParts[1], 10) - 1] || sParts[1];
  const sYear = sParts[0];

  const eDay = parseInt(eParts[2], 10);
  const eMonth = meses[parseInt(eParts[1], 10) - 1] || eParts[1];
  const eYear = eParts[0];

  // Mismo mes y mismo año (ej: 1 al 31 de Octubre de 2026)
  if (sMonth === eMonth && sYear === eYear) {
    return `${sDay} - ${eDay} de ${sMonth} de ${sYear}`;
  }

  // Mismo año, distinto mes (ej: 15 de Septiembre al 15 de Octubre de 2026)
  if (sYear === eYear) {
    return `${sDay} de ${sMonth} - ${eDay} de ${eMonth} de ${sYear}`;
  }

  // Distinto año (ej: 15 de Diciembre de 2025 al 15 de Enero de 2026)
  return `${sDay} de ${sMonth} de ${sYear} - ${eDay} de ${eMonth} de ${eYear}`;
};

const computeSectionsFallback = (pagesRows, totalClicks, totalImp) => {
  const sections = {
    home: {
      id: 'home',
      name: 'Inicio (Home)',
      icon: '🏠',
      color: '#3b82f6',
      description: 'Página principal y portada general de Indus3',
      clicks_current: 0,
      impressions_current: 0,
      top_pages: []
    },
    servicios: {
      id: 'servicios',
      name: 'Servicios',
      icon: '💼',
      color: '#f59e0b',
      description: 'Portafolio de producción, streaming y servicios para marcas',
      clicks_current: 0,
      impressions_current: 0,
      top_pages: []
    },
    eventos: {
      id: 'eventos',
      name: 'Eventos',
      icon: '🎟️',
      color: '#ec4899',
      description: 'Cartelera de conciertos, festivales y coberturas',
      clicks_current: 0,
      impressions_current: 0,
      top_pages: []
    },
    blog: {
      id: 'blog',
      name: 'Blog & Noticias',
      icon: '📰',
      color: '#06b6d4',
      description: 'Artículos, notas de prensa y novedades del blog',
      clicks_current: 0,
      impressions_current: 0,
      top_pages: []
    },
    biografias: {
      id: 'biografias',
      name: 'Biografías',
      icon: '🎤',
      color: '#a855f7',
      description: 'Perfiles biográficos y trayectorias de artistas',
      clicks_current: 0,
      impressions_current: 0,
      top_pages: []
    },
    spotify: {
      id: 'spotify',
      name: 'Top Spotify',
      icon: '🎧',
      color: '#10b981',
      description: 'Rankings de artistas y canciones más escuchadas de Spotify',
      clicks_current: 0,
      impressions_current: 0,
      top_pages: []
    },
    guias: {
      id: 'guias',
      name: 'Guías',
      icon: '📚',
      color: '#0284c7',
      description: 'Guías informativas, recomendaciones y tutoriales',
      clicks_current: 0,
      impressions_current: 0,
      top_pages: []
    },
    contacto: {
      id: 'contacto',
      name: 'Contacto',
      icon: '✉️',
      color: '#64748b',
      description: 'Página de contacto, cotizaciones y atención al cliente',
      clicks_current: 0,
      impressions_current: 0,
      top_pages: []
    }
  };

  (pagesRows || []).forEach((r) => {
    const pageUrl = r.page || (r.keys && r.keys[0]) || '';
    if (!pageUrl) return;
    const clean = r.clean_path || pageUrl.replace(/^https?:\/\/[^\/]+/, '') || '/';
    const c = r.clicks_current || r.clicks || 0;
    const imp = r.impressions_current || r.impressions || 0;
    const pLower = clean.toLowerCase();

    let secKey = 'contacto';
    if (!clean || clean === '/' || clean === '' || clean === '/index.html') {
      secKey = 'home';
    } else if (pLower.includes('/top-spotify')) {
      secKey = 'spotify';
    } else if (pLower.includes('/blog')) {
      secKey = 'blog';
    } else if (pLower.includes('/biografia')) {
      secKey = 'biografias';
    } else if (pLower.includes('/servicios')) {
      secKey = 'servicios';
    } else if (pLower.includes('/eventos')) {
      secKey = 'eventos';
    } else if (pLower.includes('/guias')) {
      secKey = 'guias';
    } else if (pLower.includes('/contacto')) {
      secKey = 'contacto';
    }

    if (sections[secKey]) {
      sections[secKey].clicks_current += c;
      sections[secKey].impressions_current += imp;
      sections[secKey].top_pages.push({
        page: pageUrl,
        clean_path: clean,
        clicks: c,
        impressions: imp
      });
    }
  });

  return Object.values(sections)
    .map((s) => {
      const shareClicks = totalClicks > 0 ? parseFloat(((s.clicks_current / totalClicks) * 100).toFixed(1)) : 0;
      const shareImp = totalImp > 0 ? parseFloat(((s.impressions_current / totalImp) * 100).toFixed(1)) : 0;
      const ctr = s.impressions_current > 0 ? parseFloat(((s.clicks_current / s.impressions_current) * 100).toFixed(2)) : 0;
      s.top_pages.sort((a, b) => b.clicks - a.clicks);
      return {
        ...s,
        share_clicks_pct: shareClicks,
        share_impressions_pct: shareImp,
        ctr,
        diff_clicks: 0,
        diff_clicks_pct: 0,
        top_pages: s.top_pages.slice(0, 3)
      };
    })
    .sort((a, b) => b.clicks_current - a.clicks_current);
};

const defaultChannelsList = (rep) => {
  const cClicks = rep?.kpis?.clicks?.current || 0;
  const cImp = rep?.kpis?.impressions?.current || 0;
  return [
    {
      id: 'web',
      name: 'Búsqueda Web Estándar',
      icon: '🌐',
      description: 'Resultados orgánicos clásicos en Google',
      clicks: cClicks,
      impressions: cImp,
      ctr: rep?.kpis?.ctr?.current || 0,
      share_clicks_pct: 100,
      share_impressions_pct: 100,
      available: true
    },
    {
      id: 'image',
      name: 'Google Imágenes',
      icon: '🖼️',
      description: 'Búsquedas de imágenes y fotos de Indus3',
      clicks: 0,
      impressions: 0,
      ctr: 0,
      share_clicks_pct: 0,
      share_impressions_pct: 0,
      available: false
    },
    {
      id: 'news',
      name: 'Google Noticias (Pestaña)',
      icon: '📰',
      description: 'Apariciones en la pestaña Noticias de Google',
      clicks: 0,
      impressions: 0,
      ctr: 0,
      share_clicks_pct: 0,
      share_impressions_pct: 0,
      available: false
    },
    {
      id: 'discover',
      name: 'Google Discover',
      icon: '📱',
      description: 'Feed de recomendaciones de Google en móviles',
      clicks: 0,
      impressions: 0,
      ctr: 0,
      share_clicks_pct: 0,
      share_impressions_pct: 0,
      available: false
    },
    {
      id: 'googleNews',
      name: 'Google News (App & Web)',
      icon: '🗞️',
      description: 'Tráfico directo desde la app o news.google.com',
      clicks: 0,
      impressions: 0,
      ctr: 0,
      share_clicks_pct: 0,
      share_impressions_pct: 0,
      available: false
    }
  ];
};

/**
 * SearchConsoleReportDoc
 * Componente dedicado que renderiza el documento formal de informe SEO.
 * Cada sección importante se estructura como una hoja horizontal independiente con encabezado, contenido y pie de página numerado.
 */
const SearchConsoleReportDoc = ({
  report,
  reportOptions,
  importedAiData = null,
}) => {
  if (!report) return null;

  // Helper para normalizar el nombre del dispositivo
  const formatDevName = (name) => {
    if (!name) return 'PC';
    const n = name.trim().toLowerCase();
    if (n === 'ordenador' || n === 'ordenadores' || n === 'desktop' || n === 'computadora') return 'PC';
    if (n === 'movil' || n === 'moviles' || n === 'mobile') return 'Móviles';
    if (n === 'tablet' || n === 'tablets' || n === 'tableta') return 'Tablets';
    return name;
  };

  // CÁLCULO SEGURO Y EXACTO DE KPIS (Garantiza coherencia matemática frontend-backend)
  const clicksCurrent = Number(report?.kpis?.clicks?.current) || 0;
  const clicksPrev = Number(report?.kpis?.clicks?.prev) || 0;
  const clicksDiffPct = clicksPrev > 0
    ? Number((((clicksCurrent - clicksPrev) / clicksPrev) * 100).toFixed(2))
    : (clicksCurrent > 0 ? 100 : 0);

  const impCurrent = Number(report?.kpis?.impressions?.current) || 0;
  const impPrev = Number(report?.kpis?.impressions?.prev) || 0;
  const impDiffPct = impPrev > 0
    ? Number((((impCurrent - impPrev) / impPrev) * 100).toFixed(2))
    : (impCurrent > 0 ? 100 : 0);

  const ctrCurrent = Number(report?.kpis?.ctr?.current) || 0;
  const ctrPrev = Number(report?.kpis?.ctr?.prev) || 0;
  const ctrDiffPts = Number((ctrCurrent - ctrPrev).toFixed(2));

  const posCurrent = Number(report?.kpis?.position?.current) || 0;
  const posPrev = Number(report?.kpis?.position?.prev) || 0;
  // En Google SEO, si la posición media baja en número (ej. de #15 a #12), subió puestos en el buscador
  const posDiff = Number((posPrev - posCurrent).toFixed(1));

  // Estados interactivos para vista en pantalla
  const [pagesTab, setPagesTab] = useState('clicks'); // 'clicks' | 'up' | 'down'
  const [queriesTab, setQueriesTab] = useState('clicks'); // 'clicks' | 'up' | 'down'
  const [aiDimensionTab, setAiDimensionTab] = useState('pages'); // 'pages' | 'countries' | 'devices'
  const [showChartClicks, setShowChartClicks] = useState(true);
  const [showChartImpressions, setShowChartImpressions] = useState(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const chartSvgRef = useRef(null);

  // 1. Preparación de datos del Gráfico General de Búsqueda
  const rawTimeline = report.timeline || [];
  const timeline = rawTimeline.map((d) => ({
    ...d,
    date: d.date || (d.keys && d.keys[0]) || '',
    clicks: Number(d.clicks) || 0,
    impressions: Number(d.impressions) || 0
  }));

  const maxClicks = Math.max(...timeline.map((d) => d.clicks), 1);
  const maxImpressions = Math.max(...timeline.map((d) => d.impressions), 1);

  // Récords / Pico más alto para Clics e Impresiones
  let peakClicks = report.timeline_peaks?.clicks || { clicks: 0, date: '' };
  let peakImpressions = report.timeline_peaks?.impressions || { impressions: 0, date: '' };

  if (!peakClicks.clicks || !peakClicks.date) {
    timeline.forEach((d) => {
      if (d.clicks > peakClicks.clicks) {
        peakClicks = { clicks: d.clicks, date: d.date };
      }
    });
  }

  if (!peakImpressions.impressions || !peakImpressions.date) {
    timeline.forEach((d) => {
      if (d.impressions > peakImpressions.impressions) {
        peakImpressions = { impressions: d.impressions, date: d.date };
      }
    });
  }

  const svgWidth = 900;
  const svgHeight = 210; // Altura compacta para garantizar ajuste perfecto en Página 1
  const padLeft = 45;
  const padRight = 50;
  const padTop = 15;
  const padBottom = 30;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const chartPoints = timeline.map((d, i) => {
    const x = padLeft + (i / Math.max(timeline.length - 1, 1)) * plotWidth;
    const yClicks = padTop + plotHeight - (d.clicks / maxClicks) * plotHeight;
    const yImp = padTop + plotHeight - (d.impressions / maxImpressions) * plotHeight;
    return { ...d, x, yClicks, yImp };
  });

  const peakClicksPoint = chartPoints.find((p) => p.clicks === peakClicks.clicks && p.date === peakClicks.date && peakClicks.clicks > 0);
  const peakImpPoint = chartPoints.find((p) => p.impressions === peakImpressions.impressions && p.date === peakImpressions.date && peakImpressions.impressions > 0);

  const clicksLinePath = chartPoints.length > 0
    ? chartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yClicks.toFixed(1)}`).join(' ')
    : '';
  const clicksAreaPath = chartPoints.length > 0
    ? `${clicksLinePath} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${padTop + plotHeight} L ${chartPoints[0].x.toFixed(1)} ${padTop + plotHeight} Z`
    : '';

  const impLinePath = chartPoints.length > 0
    ? chartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yImp.toFixed(1)}`).join(' ')
    : '';
  const impAreaPath = chartPoints.length > 0
    ? `${impLinePath} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${padTop + plotHeight} L ${chartPoints[0].x.toFixed(1)} ${padTop + plotHeight} Z`
    : '';

  const xTickStep = Math.max(1, Math.floor(chartPoints.length / 6));
  const xTicks = chartPoints.filter((_, idx) => idx % xTickStep === 0 || idx === chartPoints.length - 1);
  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  const handleChartMouseMove = (e) => {
    if (!chartSvgRef.current || chartPoints.length === 0) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgMouseX = (mouseX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    chartPoints.forEach((p, idx) => {
      const diff = Math.abs(p.x - svgMouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredPointIndex(closestIdx);
  };

  const hoveredPoint = hoveredPointIndex !== null && chartPoints[hoveredPointIndex]
    ? chartPoints[hoveredPointIndex]
    : null;

  // 2. Preparación de datos de IA Generativa
  const getStoredAiData = () => {
    if (importedAiData) return importedAiData;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const s = report?.period?.current?.start_date;
        const e = report?.period?.current?.end_date;
        const byDate = (s && e) ? localStorage.getItem(`indus3_gsc_ai_${s}_${e}`) : null;
        const latest = localStorage.getItem('indus3_gsc_ai_latest');
        const raw = byDate || latest;
        if (raw) return JSON.parse(raw);
      } catch (err) {}
    }
    return null;
  };

  const aiSourceData = importedAiData || getStoredAiData() || report.ai_performance || null;
  const aiTotalImpressions = aiSourceData?.total_impressions || 0;
  const aiShareOfTotalPct = (report?.kpis?.impressions?.current && report.kpis.impressions.current > 0)
    ? parseFloat(((aiTotalImpressions / report.kpis.impressions.current) * 100).toFixed(1))
    : (aiSourceData?.share_of_total_pct || 0);

  const aiTimeline = aiSourceData?.timeline || [];
  const maxAiImpressions = Math.max(...aiTimeline.map((d) => d.impressions), 1);
  const aiSvgHeight = 85;
  const aiChartPoints = aiTimeline.map((d, i) => {
    const x = padLeft + (i / Math.max(aiTimeline.length - 1, 1)) * plotWidth;
    const yImp = 8 + 56 - ((d.impressions / maxAiImpressions) * 56);
    return { ...d, x, yImp };
  });

  const aiXTickStep = Math.max(1, Math.floor(aiChartPoints.length / 6));
  const aiXTicks = aiChartPoints.filter((_, idx) => idx % aiXTickStep === 0 || idx === aiChartPoints.length - 1);

  const aiPagesList = (aiSourceData?.top_pages || []).slice(0, 8);
  const aiCountriesList = (aiSourceData?.top_countries || []).slice(0, 5);
  const aiDevicesList = aiSourceData?.devices || [];

  // 3. Listas Top 20 (hasta 20 elementos si están disponibles)
  const getPagesList = () => {
    if (pagesTab === 'up') return (report.trending_pages?.up || []).slice(0, 20);
    if (pagesTab === 'down') return (report.trending_pages?.down || []).slice(0, 20);
    if (report.trending_pages?.top_clicks && report.trending_pages.top_clicks.length > 0) {
      return report.trending_pages.top_clicks.slice(0, 20);
    }
    const combined = [...(report.trending_pages?.up || []), ...(report.trending_pages?.down || [])];
    return combined.sort((a, b) => b.clicks_current - a.clicks_current).slice(0, 20);
  };

  const getQueriesList = () => {
    if (queriesTab === 'up') return (report.trending_queries?.up || []).slice(0, 20);
    if (queriesTab === 'down') return (report.trending_queries?.down || []).slice(0, 20);
    if (report.trending_queries?.top_clicks && report.trending_queries.top_clicks.length > 0) {
      return report.trending_queries.top_clicks.slice(0, 20);
    }
    const combined = [...(report.trending_queries?.up || []), ...(report.trending_queries?.down || [])];
    return combined.sort((a, b) => b.clicks_current - a.clicks_current).slice(0, 20);
  };

  const currentPagesList = getPagesList();
  const currentQueriesList = getQueriesList();
  const topCountriesList = (report?.top_countries || []).slice(0, 20);

  // 4. Secciones & Canales
  const sectionsList = (report?.sections && report.sections.length > 0)
    ? report.sections
    : computeSectionsFallback(report?.trending_pages?.top_clicks || report?.trending_pages?.up, report?.kpis?.clicks?.current, report?.kpis?.impressions?.current);

  const channelsList = (report?.channels && report.channels.length > 0)
    ? report.channels
    : defaultChannelsList(report);

  // 5. CÁLCULO EXACTO DE PÁGINAS ACTIVAS (Hojas independientes)
  const activePages = [];
  if (reportOptions.showClicks || reportOptions.showImpressions || reportOptions.showChart) {
    activePages.push('summary');
  }
  if (reportOptions.showChannels && channelsList.length > 0) {
    activePages.push('channels');
  }
  if (reportOptions.showSections && sectionsList.length > 0) {
    activePages.push('sections');
  }
  if (reportOptions.showAiGenerative) {
    activePages.push('ai_generative');
  }
  if (reportOptions.showPages && currentPagesList.length > 0) {
    activePages.push('top_pages');
  }
  if (reportOptions.showQueries && currentQueriesList.length > 0) {
    activePages.push('top_queries');
  }
  if (reportOptions.showCountries && topCountriesList.length > 0) {
    activePages.push('top_countries');
  }

  const totalPages = Math.max(activePages.length, 1);
  const getPageNum = (key) => {
    const idx = activePages.indexOf(key);
    return idx >= 0 ? idx + 1 : 1;
  };

  const periodText = formatPeriodText(
    report?.period?.current?.start_date,
    report?.period?.current?.end_date
  );

  // Subcomponente de Encabezado con título, período, autor y paginado
  const ReportHeader = ({ pageKey }) => (
    <div className={styles.reportHeader}>
      <div className={styles.headerLeft}>
        <h1 className={styles.headerTitle}>
          Informe <strong>Indus3</strong>: {periodText ? `${periodText}` : ''}
        </h1>
        <p className={styles.headerAuthor}>
          Elaborado por: <strong>ProfesorJAnd</strong>
        </p>
      </div>
      <div className={styles.headerRight}>
        <span className={styles.headerPageNumber}>
          Página {getPageNum(pageKey)} de {totalPages}
        </span>
      </div>
    </div>
  );

  return (
    <div className={styles.reportContainer}>

      {/* =========================================================================
          HOJA 1: RESUMEN EJECUTIVO & GRÁFICO DE EVOLUCIÓN DIARIA
          ========================================================================= */}
      {activePages.includes('summary') && (
        <section className={styles.reportSheet}>
          <ReportHeader pageKey="summary" />

          <div className={styles.pageBody}>
            {/* KPIs Principales con desglose por dispositivos */}
            <div className={styles.kpiGrid}>
              {reportOptions.showClicks && (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiTitle}>Clics Totales</span>
                    <span style={{ fontSize: '1.2rem' }}>🖱️</span>
                  </div>
                  <div className={styles.kpiValue}>
                    {formatNumber(clicksCurrent)}
                  </div>
                  <div className={styles.kpiFooter}>
                    <span className={clicksDiffPct >= 0 ? styles.badgeTrendUp : styles.badgeTrendDown}>
                      {clicksDiffPct >= 0 ? `+${clicksDiffPct}%` : `${clicksDiffPct}%`}
                    </span>
                    <span>vs anterior ({formatNumber(clicksPrev)})</span>
                  </div>

                  {report.kpis.clicks.by_device && report.kpis.clicks.by_device.length > 0 && (
                    <div className={styles.kpiDeviceBreakdown}>
                      {report.kpis.clicks.by_device.map((dev) => (
                        <div key={dev.device} className={styles.kpiDeviceItem}>
                          <span className={styles.kpiDeviceName}>
                            {dev.icon} {formatDevName(dev.name)}:
                          </span>
                          <span className={styles.kpiDeviceValue} style={{ color: '#60a5fa' }}>
                            {formatNumber(dev.clicks)}{' '}
                            <span className={styles.kpiDeviceShare}>({dev.share_pct}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {reportOptions.showImpressions && (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiTitle}>Impresiones Totales</span>
                    <span style={{ fontSize: '1.2rem' }}>👁️</span>
                  </div>
                  <div className={styles.kpiValue}>
                    {formatNumber(impCurrent)}
                  </div>
                  <div className={styles.kpiFooter}>
                    <span className={impDiffPct >= 0 ? styles.badgeTrendUp : styles.badgeTrendDown}>
                      {impDiffPct >= 0 ? `+${impDiffPct}%` : `${impDiffPct}%`}
                    </span>
                    <span>vs anterior ({formatNumber(impPrev)})</span>
                  </div>

                  {report.kpis.impressions.by_device && report.kpis.impressions.by_device.length > 0 && (
                    <div className={styles.kpiDeviceBreakdown}>
                      {report.kpis.impressions.by_device.map((dev) => (
                        <div key={dev.device} className={styles.kpiDeviceItem}>
                          <span className={styles.kpiDeviceName}>
                            {dev.icon} {formatDevName(dev.name)}:
                          </span>
                          <span className={styles.kpiDeviceValue} style={{ color: '#c084fc' }}>
                            {formatNumber(dev.impressions)}{' '}
                            <span className={styles.kpiDeviceShare}>({dev.share_pct}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {reportOptions.showCtr && (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiTitle}>CTR Promedio</span>
                    <span style={{ fontSize: '1.2rem' }}>🎯</span>
                  </div>
                  <div className={styles.kpiValue}>
                    {ctrCurrent}%
                  </div>
                  <div className={styles.kpiFooter}>
                    <span className={ctrDiffPts >= 0 ? styles.badgeTrendUp : styles.badgeTrendDown}>
                      {ctrDiffPts >= 0 ? `+${ctrDiffPts}` : `${ctrDiffPts}`} pts
                    </span>
                    <span>vs anterior ({ctrPrev}%)</span>
                  </div>
                </div>
              )}

              {reportOptions.showPosition && (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiTitle}>Posición Media</span>
                    <span style={{ fontSize: '1.2rem' }}>📍</span>
                  </div>
                  <div className={styles.kpiValue}>
                    #{posCurrent}
                  </div>
                  <div className={styles.kpiFooter}>
                    <span className={posDiff >= 0 ? styles.badgeTrendUp : styles.badgeTrendDown}>
                      {posDiff >= 0 ? `🟢 +${posDiff} puestos` : `🔴 ${posDiff} puestos`}
                    </span>
                    <span>vs anterior (#{posPrev})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico Lineal de Evolución Diaria */}
            {reportOptions.showChart && chartPoints.length > 0 && (
              <div className={styles.chartCard}>
                <div className={styles.chartTopBar}>
                  <div className={styles.chartTitleBox}>
                    <span style={{ fontSize: '1.2rem' }}>📈</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>
                        Resultados de la Búsqueda: Clics e Impresiones Diarias
                      </h4>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {chartPoints.length} días analizados ({formatDateNice(chartPoints[0].date)} al {formatDateNice(chartPoints[chartPoints.length - 1].date)})
                      </span>
                    </div>
                  </div>

                  <div className={styles.chartLegendBox}>
                    <div
                      className={`${styles.legendPill} ${showChartClicks ? styles.legendPillClicksActive : styles.legendPillInactive}`}
                      onClick={() => setShowChartClicks(!showChartClicks)}
                      title={peakClicks.clicks > 0 ? `Pico más alto de clics: ${formatNumber(peakClicks.clicks)} el ${formatDateFull(peakClicks.date)}` : 'Clics diarios'}
                    >
                      <span className={styles.legendDot} style={{ background: '#3b82f6' }} />
                      <span>
                        🔵 Clics {peakClicks.clicks > 0 ? (
                          <>• Máx: <strong>{formatNumber(peakClicks.clicks)}</strong> ({formatDateNice(peakClicks.date)})</>
                        ) : ''}
                      </span>
                    </div>
                    <div
                      className={`${styles.legendPill} ${showChartImpressions ? styles.legendPillImpActive : styles.legendPillInactive}`}
                      onClick={() => setShowChartImpressions(!showChartImpressions)}
                      title={peakImpressions.impressions > 0 ? `Pico más alto de impresiones: ${formatNumber(peakImpressions.impressions)} el ${formatDateFull(peakImpressions.date)}` : 'Impresiones diarias'}
                    >
                      <span className={styles.legendDot} style={{ background: '#a855f7' }} />
                      <span>
                        🟣 Impresiones {peakImpressions.impressions > 0 ? (
                          <>• Máx: <strong>{formatNumber(peakImpressions.impressions)}</strong> ({formatDateNice(peakImpressions.date)})</>
                        ) : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={styles.chartSvgWrapper}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                >
                  {hoveredPoint && (
                    <div
                      className={styles.chartTooltipFloating}
                      style={{
                        left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                        transform: hoveredPoint.x > 750 ? 'translateX(-85%)' : hoveredPoint.x < 250 ? 'translateX(-15%)' : 'translateX(-50%)'
                      }}
                    >
                      <div className={styles.tooltipDate}>
                        📅 {formatDateFull(hoveredPoint.date)}
                      </div>
                      {showChartClicks && (
                        <div className={styles.tooltipItem} style={{ color: '#60a5fa' }}>
                          <span>🔵 Clics:</span>
                          <span style={{ fontWeight: 800 }}>
                            {formatNumber(hoveredPoint.clicks)}
                            {peakClicks.clicks > 0 && hoveredPoint.clicks === peakClicks.clicks && (
                              <span style={{ fontSize: '0.68rem', color: '#fef08a', marginLeft: '0.35rem', fontWeight: 700 }}>
                                ⭐ Máx
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {showChartImpressions && (
                        <div className={styles.tooltipItem} style={{ color: '#c084fc' }}>
                          <span>🟣 Impresiones:</span>
                          <span style={{ fontWeight: 800 }}>
                            {formatNumber(hoveredPoint.impressions)}
                            {peakImpressions.impressions > 0 && hoveredPoint.impressions === peakImpressions.impressions && (
                              <span style={{ fontSize: '0.68rem', color: '#fef08a', marginLeft: '0.35rem', fontWeight: 700 }}>
                                ⭐ Máx
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <svg
                    ref={chartSvgRef}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className={styles.chartSvg}
                  >
                    <defs>
                      <linearGradient id="gscClicksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="gscImpGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {gridLevels.map((lvl, idx) => {
                      const y = padTop + plotHeight - lvl * plotHeight;
                      return (
                        <g key={idx}>
                          <line
                            x1={padLeft}
                            y1={y}
                            x2={padLeft + plotWidth}
                            y2={y}
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          {showChartClicks && (
                            <text
                              x={padLeft - 8}
                              y={y + 4}
                              textAnchor="end"
                              fill="#60a5fa"
                              fontSize="10"
                              fontWeight="600"
                            >
                              {Math.round(lvl * maxClicks)}
                            </text>
                          )}
                          {showChartImpressions && (
                            <text
                              x={padLeft + plotWidth + 8}
                              y={y + 4}
                              textAnchor="start"
                              fill="#c084fc"
                              fontSize="10"
                              fontWeight="600"
                            >
                              {Math.round(lvl * maxImpressions)}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    <line
                      x1={padLeft}
                      y1={padTop + plotHeight}
                      x2={padLeft + plotWidth}
                      y2={padTop + plotHeight}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="1.5"
                    />

                    {xTicks.map((p, idx) => (
                      <g key={idx}>
                        <line
                          x1={p.x}
                          y1={padTop + plotHeight}
                          x2={p.x}
                          y2={padTop + plotHeight + 4}
                          stroke="rgba(255, 255, 255, 0.3)"
                          strokeWidth="1.2"
                        />
                        <text
                          x={p.x}
                          y={padTop + plotHeight + 17}
                          textAnchor={idx === 0 ? 'start' : idx === xTicks.length - 1 ? 'end' : 'middle'}
                          fill="#cbd5e1"
                          fontSize="10"
                          fontWeight="600"
                        >
                          {formatDateNice(p.date)}
                        </text>
                      </g>
                    ))}

                    {showChartImpressions && (
                      <>
                        <path d={impAreaPath} fill="url(#gscImpGradient)" />
                        <path
                          d={impLinePath}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    )}

                    {showChartClicks && (
                      <>
                        <path d={clicksAreaPath} fill="url(#gscClicksGradient)" />
                        <path
                          d={clicksLinePath}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    )}

                    {/* Puntos destacados permanentes del pico más alto (Récord del período) */}
                    {showChartImpressions && peakImpPoint && (
                      <g>
                        <circle
                          cx={peakImpPoint.x}
                          cy={peakImpPoint.yImp}
                          r="4.5"
                          fill="#a855f7"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </g>
                    )}

                    {showChartClicks && peakClicksPoint && (
                      <g>
                        <circle
                          cx={peakClicksPoint.x}
                          cy={peakClicksPoint.yClicks}
                          r="5"
                          fill="#3b82f6"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </g>
                    )}

                    {hoveredPoint && (
                      <g>
                        <line
                          x1={hoveredPoint.x}
                          y1={padTop}
                          x2={hoveredPoint.x}
                          y2={padTop + plotHeight}
                          stroke="rgba(255, 255, 255, 0.5)"
                          strokeDasharray="4 4"
                          strokeWidth="1.5"
                        />
                        {showChartImpressions && (
                          <circle
                            cx={hoveredPoint.x}
                            cy={hoveredPoint.yImp}
                            r="5"
                            fill="#a855f7"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        )}
                        {showChartClicks && (
                          <circle
                            cx={hoveredPoint.x}
                            cy={hoveredPoint.yClicks}
                            r="6"
                            fill="#3b82f6"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        )}
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            )}
          </div>

        </section>
      )}

      {/* =========================================================================
          HOJA: CANALES DE BÚSQUEDA DE GOOGLE (HOJA INDEPENDIENTE)
          ========================================================================= */}
      {activePages.includes('channels') && (
        <section className={styles.reportSheet}>
          <ReportHeader pageKey="channels" />

          <div className={styles.pageBody}>
            {channelsList.length > 0 && (
              <div className={styles.cardSection}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <span>📡 Canales de Búsqueda de Google</span>
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Tráfico orgánico desglosado por tipo de búsqueda: Web, Imágenes, Google Noticias y Discover
                  </span>
                </div>

                <div className={styles.channelsGrid}>
                  {channelsList.map((ch) => (
                    <div key={ch.id} className={styles.channelCard}>
                      <div className={styles.channelHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.35rem' }}>{ch.icon}</span>
                          <div>
                            <h5 className={styles.channelName}>{ch.name}</h5>
                            <span className={styles.channelDesc}>{ch.description}</span>
                          </div>
                        </div>
                        {ch.clicks > 0 ? (
                          <span className={styles.channelActiveBadge}>Activo</span>
                        ) : (
                          <span className={styles.channelInactiveBadge}>0 Clics</span>
                        )}
                      </div>

                      <div className={styles.channelNumbersRow}>
                        <div className={styles.channelMetric}>
                          <span className={styles.channelMetricLabel}>Clics</span>
                          <div className={styles.channelMetricVal} style={{ color: '#60a5fa' }}>
                            {formatNumber(ch.clicks)}
                          </div>
                        </div>
                        <div className={styles.channelMetric}>
                          <span className={styles.channelMetricLabel}>Impresiones</span>
                          <div className={styles.channelMetricVal} style={{ color: '#c084fc' }}>
                            {formatNumber(ch.impressions)}
                          </div>
                        </div>
                        {reportOptions.showCtr && (
                          <div className={styles.channelMetric}>
                            <span className={styles.channelMetricLabel}>CTR</span>
                            <div className={styles.channelMetricVal} style={{ color: '#34d399' }}>
                              {ch.ctr}%
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.channelFooterNote}>
                        {ch.id === 'web' && '🔎 Tráfico orgánico de la búsqueda general de Google.'}
                        {ch.id === 'image' && '🖼️ Personas que encuentran fotos y artistas de Indus3 en Google Imágenes.'}
                        {ch.id === 'news' && '📰 Artículos de Indus3 en la pestaña Noticias de Google.'}
                        {ch.id === 'discover' && '📱 Recomendaciones en el feed Discover de teléfonos móviles.'}
                        {ch.id === 'googleNews' && '🗞️ Lectores desde la app Google News o news.google.com.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </section>
      )}

      {/* =========================================================================
          HOJA: RENDIMIENTO POR SECCIONES DE INDUS3 (HOJA INDEPENDIENTE)
          ========================================================================= */}
      {activePages.includes('sections') && (
        <section className={styles.reportSheet}>
          <ReportHeader pageKey="sections" />

          <div className={styles.pageBody}>
            {sectionsList.length > 0 && (
              <div className={styles.cardSection}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>
                    <span>🏛️ Rendimiento por Secciones de Indus3</span>
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>
                    Total Clics Web: {formatNumber(report.kpis.clicks.current)}
                  </div>
                </div>

                <div className={styles.sectionsGrid}>
                  {sectionsList.map((sec) => (
                    <div key={sec.id} className={styles.sectionItemCard}>
                      <div className={styles.sectionItemTop}>
                        <div className={styles.sectionItemIconBox}>
                          <span style={{ fontSize: '1.4rem' }}>{sec.icon}</span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span className={styles.sectionItemName}>{sec.name}</span>
                            </div>
                            <p className={styles.sectionItemDesc}>{sec.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className={styles.sectionMetricsRow}>
                        <div className={styles.sectionMetric}>
                          <span className={styles.sectionMetricLabel}>Clics</span>
                          <span className={styles.sectionMetricVal} style={{ color: '#60a5fa' }}>
                            {formatNumber(sec.clicks_current)}
                          </span>
                        </div>
                        <div className={styles.sectionMetric}>
                          <span className={styles.sectionMetricLabel}>Impresiones</span>
                          <span className={styles.sectionMetricVal} style={{ color: '#c084fc' }}>
                            {formatNumber(sec.impressions_current)}
                          </span>
                        </div>
                        {reportOptions.showCtr && (
                          <div className={styles.sectionMetric}>
                            <span className={styles.sectionMetricLabel}>CTR</span>
                            <span className={styles.sectionMetricVal} style={{ color: '#34d399' }}>
                              {sec.ctr}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={styles.sectionProgressBarBox}>
                        <div
                          className={styles.sectionProgressBarFill}
                          style={{
                            width: `${Math.min(100, Math.max(4, sec.share_clicks_pct))}%`,
                            background: `linear-gradient(90deg, ${sec.color}, #3b82f6)`
                          }}
                        />
                      </div>
                       <div className={styles.sectionShareBox}>
                          <span className={styles.sectionSharePct} style={{ color: sec.color }}>
                            {sec.share_clicks_pct}%
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>cuota de clics</span>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </section>
      )}

      {/* =========================================================================
          HOJA 3: RENDIMIENTO IA GENERATIVA & CHATBOTS
          ========================================================================= */}
      {activePages.includes('ai_generative') && (
        <section className={styles.reportSheet}>
          <ReportHeader pageKey="ai_generative" />

          <div className={styles.pageBody}>
            <div className={styles.aiSection}>
              <div className={styles.aiSectionHeader}>
                <div className={styles.aiTitleBox}>
                  <span style={{ fontSize: '1.4rem' }}>🤖</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                        Google Search Console: IA Generativa
                      </h3>
                      <span className={styles.aiBadge}>AI Overviews & Modo IA</span>
                    </div>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#c4b5fd' }}>
                      Métricas oficiales de <strong>impresiones</strong> de Indus3 dentro de resúmenes generativos de Google y citas de IA.
                    </p>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                  Período: <strong>{periodText}</strong>
                </div>
              </div>

              {/* Si hay datos cargados, mostrar Hero KPI + Gráfico + Desglose de Dimensiones */}
              {(aiTotalImpressions > 0 || aiPagesList.length > 0) ? (
                <>
                  {/* Hero KPI IA Generativa */}
                  <div className={styles.aiHeroRow}>
                    <div className={styles.aiHeroCardMain}>
                      <span className={styles.aiHeroLabel}>
                        Impresiones Totales en IA Generativa
                      </span>
                      <div className={styles.aiHeroVal}>
                        {formatNumber(aiTotalImpressions)}
                      </div>
                      <span className={styles.aiHeroSub}>
                        Representa el <strong>{aiShareOfTotalPct}%</strong> de todas las impresiones de búsqueda
                      </span>
                    </div>

                    <div className={styles.aiHeroCardInfo}>
                      <span className={styles.aiHeroInfoTitle}>
                        ℹ️ ¿Cómo mide Google la IA Generativa?
                      </span>
                      <p className={styles.aiHeroInfoText}>
                        Search Console contabiliza una impresión cada vez que un enlace de Indus3 aparece citado como fuente dentro de un <strong>AI Overview</strong> o en el <strong>Modo IA</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Gráfico Dedicado de Impresiones de IA Generativa */}
                  {aiChartPoints.length > 0 && (
                    <div className={styles.aiChartBox}>
                      <div className={styles.aiChartTop}>
                        <span className={styles.aiChartTitle}>
                          📈 Evolución Diaria de Citas en IA Generativa
                        </span>
                        <span className={styles.aiChartBadge}>
                          🟣 Impresiones en AI Overviews
                        </span>
                      </div>

                      <svg viewBox={`0 0 ${svgWidth} ${aiSvgHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                        <defs>
                          <linearGradient id="aiImpDocGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        <line x1={padLeft} y1={70} x2={padLeft + plotWidth} y2={70} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />

                        <path
                          d={aiChartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yImp.toFixed(1)}`).join(' ')}
                          fill="none"
                          stroke="#c084fc"
                          strokeWidth="2.2"
                        />
                        <path
                          d={`${aiChartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yImp.toFixed(1)}`).join(' ')} L ${aiChartPoints[aiChartPoints.length - 1].x.toFixed(1)} 70 L ${aiChartPoints[0].x.toFixed(1)} 70 Z`}
                          fill="url(#aiImpDocGradient)"
                        />

                        {aiXTicks.map((p, idx) => (
                          <text
                            key={idx}
                            x={p.x}
                            y={82}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="9"
                            fontWeight="600"
                          >
                            {formatDateNice(p.date)}
                          </text>
                        ))}
                      </svg>
                    </div>
                  )}

                  {/* DESGLOSE INTEGRAL DE DIMENSIONES DE IA (PÁGINAS + DISPOSITIVOS + PAÍSES) */}
                  <div className={styles.aiTwoColumns}>

                    {/* COLUMNA IZQUIERDA: PÁGINAS CITADAS POR IA */}
                    <div className={styles.aiSubCard}>
                      <div className={styles.aiSubCardHeader}>
                        <span className={styles.aiSubCardTitle}>
                          <span>📄</span> Páginas más citadas por IA ({aiPagesList.length})
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600 }}>
                          URLs en AI Overviews
                        </span>
                      </div>

                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th style={{ width: '60%' }}>Página (URL citada)</th>
                              <th style={{ width: '22%' }}>Impresiones</th>
                              <th style={{ width: '18%' }}>% Cuota</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiPagesList.map((p) => {
                              const pct = aiTotalImpressions > 0 ? ((p.impressions / aiTotalImpressions) * 100).toFixed(1) : '0';
                              return (
                                <tr key={p.page}>
                                  <td className={styles.urlCell} title={p.page}>
                                    <a href={p.page} target="_blank" rel="noopener noreferrer">
                                      {p.clean_path || '/'}
                                    </a>
                                  </td>
                                  <td style={{ fontWeight: 800, color: '#c084fc' }}>
                                    {formatNumber(p.impressions)}
                                  </td>
                                  <td style={{ color: '#cbd5e1', fontWeight: 600 }}>
                                    {pct}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* COLUMNA DERECHA: DISPOSITIVOS EN IA Y TOP PAÍSES */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>

                      {/* 1. DISPOSITIVOS EN IA */}
                      {aiDevicesList.length > 0 && (
                        <div className={styles.aiSubCard}>
                          <div className={styles.aiSubCardHeader}>
                            <span className={styles.aiSubCardTitle}>
                              <span>📱</span> Dispositivos en IA
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Móviles vs PC vs Tablets
                            </span>
                          </div>

                          <div className={styles.aiDevicesRow}>
                            {aiDevicesList.map((dev) => (
                              <div key={dev.device} className={styles.aiMiniDeviceCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 600 }}>
                                    {dev.icon} {formatDevName(dev.name)}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700 }}>
                                    {dev.share_pct}%
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', marginTop: '0.1rem' }}>
                                  {formatNumber(dev.impressions)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. TOP PAÍSES EN IA */}
                      {aiCountriesList.length > 0 && (
                        <div className={styles.aiSubCard}>
                          <div className={styles.aiSubCardHeader}>
                            <span className={styles.aiSubCardTitle}>
                              <span>🌍</span> Países con Citas en IA (Top {aiCountriesList.length})
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Distribución geográfica
                            </span>
                          </div>

                          <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                              <thead>
                                <tr>
                                  <th style={{ width: '55%' }}>País</th>
                                  <th style={{ width: '25%' }}>Impresiones</th>
                                  <th style={{ width: '20%' }}>% Cuota</th>
                                </tr>
                              </thead>
                              <tbody>
                                {aiCountriesList.map((c) => (
                                  <tr key={c.country_code}>
                                    <td style={{ fontWeight: 600 }}>{formatCountry(c.country_code)}</td>
                                    <td style={{ fontWeight: 800, color: '#c084fc' }}>
                                      {formatNumber(c.impressions)}
                                    </td>
                                    <td style={{ color: '#cbd5e1' }}>{c.share_pct}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                </>
              ) : (
                /* Estado Informativo si los CSV aún no se han importado */
                <div className={styles.aiEmptyStateCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                      📁
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#fef08a' }}>
                        Archivos de IA Generativa pendientes de importar
                      </h4>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>
                        Google Search Console no ofrece endpoint de API pública directa para AI Overviews.
                      </p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.78rem', color: '#c4b5fd', lineHeight: '1.45' }}>
                    <strong style={{ color: '#ffffff' }}>¿Cómo mostrar este informe en el PDF?</strong><br />
                    1. En Search Console, exporta los reportes del filtro <em>IA Generativa</em> (Páginas, Gráfico, Países, Dispositivos, Filtros).<br />
                    2. En la parte superior de este panel, arrastra los 5 archivos <code>.csv</code> en la caja <strong>&ldquo;Insertar Archivos de IA Generativa&rdquo;</strong>.<br />
                    3. Al hacer clic en <strong>&ldquo;Imprimir Informe / Guardar en PDF&rdquo;</strong>, esta página se completará automáticamente con los gráficos y tablas oficiales.
                  </div>
                </div>
              )}

            </div>
          </div>

        </section>
      )}

      {/* =========================================================================
          HOJA: TOP PÁGINAS MÁS VISTAS (HASTA 20)
          ========================================================================= */}
      {activePages.includes('top_pages') && (
        <section className={styles.reportSheet}>
          <ReportHeader pageKey="top_pages" />

          <div className={styles.pageBody}>
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>
                  <span>📄 Top {Math.min(20, currentPagesList.length)} Páginas Más Vistas</span>
                </h4>

                <div className={styles.tabPillGroup}>
                  <button
                    type="button"
                    className={`${styles.tabPillBtn} ${pagesTab === 'clicks' ? styles.tabPillBtnActiveClicks : ''}`}
                    onClick={() => setPagesTab('clicks')}
                  >
                    🏆 Más Clics
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabPillBtn} ${pagesTab === 'up' ? styles.tabPillBtnActiveUp : ''}`}
                    onClick={() => setPagesTab('up')}
                  >
                    🟢 Al Alza
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabPillBtn} ${pagesTab === 'down' ? styles.tabPillBtnActiveDown : ''}`}
                    onClick={() => setPagesTab('down')}
                  >
                    🔴 A la Baja
                  </button>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Página (URL Completa)</th>
                      <th>Clics</th>
                      <th>Variación</th>
                      <th>Impresiones</th>
                      {reportOptions.showCtr && <th>CTR</th>}
                      {reportOptions.showPosition && <th>Pos.</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {currentPagesList.map((item) => (
                      <tr key={item.page}>
                        <td className={styles.urlCell} title={item.page}>
                          <a href={item.page} target="_blank" rel="noopener noreferrer">
                            {item.clean_path || '/'}
                          </a>
                        </td>
                        <td style={{ fontWeight: 800, color: '#60a5fa' }}>{formatNumber(item.clicks_current)}</td>
                        <td>
                          <span className={item.diff_clicks >= 0 ? styles.badgeTrendUp : styles.badgeTrendDown}>
                            {item.diff_clicks >= 0 ? `+${item.diff_clicks}` : item.diff_clicks}
                          </span>
                        </td>
                        <td style={{ color: '#cbd5e1' }}>{formatNumber(item.impressions_current)}</td>
                        {reportOptions.showCtr && <td>{item.ctr}%</td>}
                        {reportOptions.showPosition && <td>#{item.position}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </section>
      )}

      {/* =========================================================================
          HOJA: TOP CONSULTAS DE BÚSQUEDA (KEYWORDS) (HASTA 20)
          ========================================================================= */}
      {activePages.includes('top_queries') && (
        <section className={styles.reportSheet}>
          <ReportHeader pageKey="top_queries" />

          <div className={styles.pageBody}>
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>
                  <span>🔍 Top {Math.min(20, currentQueriesList.length)} Consultas de Búsqueda (Palabras Clave)</span>
                </h4>

                <div className={styles.tabPillGroup}>
                  <button
                    type="button"
                    className={`${styles.tabPillBtn} ${queriesTab === 'clicks' ? styles.tabPillBtnActiveClicks : ''}`}
                    onClick={() => setQueriesTab('clicks')}
                  >
                    🏆 Más Clics
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabPillBtn} ${queriesTab === 'up' ? styles.tabPillBtnActiveUp : ''}`}
                    onClick={() => setQueriesTab('up')}
                  >
                    🟢 Al Alza
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabPillBtn} ${queriesTab === 'down' ? styles.tabPillBtnActiveDown : ''}`}
                    onClick={() => setQueriesTab('down')}
                  >
                    🔴 A la Baja
                  </button>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '48%' }}>Término / Consulta de Búsqueda</th>
                      <th>Clics</th>
                      <th>Variación</th>
                      <th>Posición Media</th>
                      <th>CTR Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentQueriesList.map((item) => (
                      <tr key={item.query}>
                        <td style={{ fontWeight: 600, color: '#f1f5f9' }}>"{item.query}"</td>
                        <td style={{ fontWeight: 800, color: '#60a5fa' }}>{formatNumber(item.clicks_current)}</td>
                        <td>
                          <span className={item.diff_clicks >= 0 ? styles.badgeTrendUp : styles.badgeTrendDown}>
                            {item.diff_clicks >= 0 ? `+${item.diff_clicks}` : item.diff_clicks}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#a78bfa' }}>
                            #{item.position ? item.position : '-'}
                          </span>
                        </td>
                        <td style={{ color: '#34d399', fontWeight: 600 }}>
                          {item.ctr}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </section>
      )}

      {/* =========================================================================
          HOJA: TOP PAÍSES CON MAYOR AUDIENCIA (HASTA 20)
          ========================================================================= */}
      {activePages.includes('top_countries') && (
        <section className={styles.reportSheet}>
          <ReportHeader pageKey="top_countries" />

          <div className={styles.pageBody}>
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>
                  <span>🌍 Top {Math.min(20, topCountriesList.length)} Países con Mayor Audiencia</span>
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Distribución geográfica de las personas que visitan Indus3 desde Google
                </span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>País</th>
                      <th>Clics</th>
                      <th>% de Audiencia</th>
                      <th>Impresiones</th>
                      {reportOptions.showCtr && <th>CTR</th>}
                      {reportOptions.showPosition && <th>Posición Media</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {topCountriesList.map((c) => (
                      <tr key={c.country_code}>
                        <td style={{ fontWeight: 600 }}>{formatCountry(c.country_code)}</td>
                        <td style={{ fontWeight: 800, color: '#60a5fa' }}>{formatNumber(c.clicks)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, c.share_pct)}%`, height: '100%', background: '#3b82f6' }} />
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{c.share_pct}%</span>
                          </div>
                        </td>
                        <td style={{ color: '#cbd5e1' }}>{formatNumber(c.impressions)}</td>
                        {reportOptions.showCtr && <td>{c.ctr}%</td>}
                        {reportOptions.showPosition && <td>#{c.position}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </section>
      )}

    </div>
  );
};

export default SearchConsoleReportDoc;

