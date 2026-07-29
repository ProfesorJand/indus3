import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import EventForm from '../forms/EventForm.jsx';
import BioForm from './BioForm.jsx';
import SliderForm from './SliderForm.jsx';

const Dashboard = ({ initialEvents = [], initialBios = [], initialSliders = [], initialPastFiles = [] }) => {
  const [activeTab, setActiveTab] = useState('events'); // 'overview', 'events', 'bios', 'sliders', 'pastEvents'
  const [events, setEvents] = useState([]);
  const [bios, setBios] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [pastEventsList, setPastEventsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const [authorized, setAuthorized] = useState(false);

  useEffect(()=>{
    if (sessionStorage.getItem('indus3_admin_session') !== 'true') {
      window.location.replace('/admin');
      return;
    }
    setAuthorized(true);
    if (initialEvents.length) setEvents(initialEvents);
    if (initialBios.length) setBios(initialBios);
    if (initialSliders.length) setSliders(initialSliders);
    refreshData();
  },[])
  // Re-fetch data helper
  const refreshData = async () => {
    try {
      // Re-fetch biographies using the same logic as the initial load but client-side
      const resBios = await fetch('https://api.indus3pro.com/biografias/get-biografias.php?t='+Date.now(),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
          }
        }
      );
      console.log({resBios})
      if (resBios.ok) {
        const updatedBios = await resBios.json();
        console.log({updatedBios})
        setBios(updatedBios.data);
      }

      // Re-fetch events
      const resEvents = await fetch('https://api.indus3pro.com/eventos/get-eventos.php?t='+Date.now(),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
          }
        }
      );
      console.log({resEvents})
      if (resEvents.ok) {
        const updatedEvents = await resEvents.json();
        setEvents(updatedEvents.data);
      }

      // Re-fetch sliders
      const resSliders = await fetch('https://api.indus3pro.com/sliders/get-sliders.php?t='+Date.now(),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
          }
        }
      );
      if (resSliders.ok) {
        const updatedSliders = await resSliders.json();
        setSliders(updatedSliders.data || []);
        console.log({updatedSliders})
      }
    } catch (e) { 
      console.error("Error refreshing dashboard data:", e); 
    }
  };

  const handleDelete = async (type, id) => {
    console.log("handleDelete",type,id)
    if (!confirm('¿Estás seguro de eliminar este ítem?')) return;
    
    // Updated endpoints to match the new structure
    let endpoint;
    if (type === 'event') endpoint = 'https://api.indus3pro.com/eventos/delete-event.php';
    else if (type === 'bio') endpoint = 'https://api.indus3pro.com/biografias/delete-bio.php';
    else if (type === 'slider') endpoint = 'https://api.indus3pro.com/sliders/delete-slider.php';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
        },
        body: JSON.stringify({ id })
      });
      console.log({res})
      const data = await res.json();
      console.log({data})
      if (data.success) {
        if (type === 'event') setEvents(prev => prev.filter(e => e.id !== id));
        else if (type === 'bio') setBios(prev => prev.filter(b => b.id !== id));
        else if (type === 'slider') setSliders(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) { alert('Error al eliminar'); }
  };

  useEffect(() => {
    const orderObj = events.find(e => e.id === '__indus3_past_events_order__');
    const savedOrder = orderObj?.orderList || JSON.parse(localStorage.getItem('indus3_past_events_order') || '[]');

    const apiPastEvents = events
      .filter(e => e.esPasado && e.id !== '__indus3_past_events_order__')
      .map(e => ({
        id: String(e.id),
        image: e.flyerEvento || e.imagenPR || e.imagenBanner,
        title: e.nombreEvento,
        category: 'Evento API'
      }));

    const combined = [...apiPastEvents, ...initialPastFiles];
    const orderMap = new Map();
    savedOrder.forEach((id, idx) => orderMap.set(String(id), idx));

    const sorted = [...combined].sort((a, b) => {
      const indexA = orderMap.has(String(a.id)) ? orderMap.get(String(a.id)) : -1;
      const indexB = orderMap.has(String(b.id)) ? orderMap.get(String(b.id)) : -1;
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });

    setPastEventsList(sorted);
  }, [events, initialPastFiles]);

  const movePastEvent = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= pastEventsList.length) return;
    const newList = [...pastEventsList];
    const [removed] = newList.splice(index, 1);
    newList.splice(newIndex, 0, removed);
    setPastEventsList(newList);
  };

  const movePastEventToEdge = (index, toTop) => {
    const newList = [...pastEventsList];
    const [removed] = newList.splice(index, 1);
    if (toTop) {
      newList.unshift(removed);
    } else {
      newList.push(removed);
    }
    setPastEventsList(newList);
  };

  const savePastEventsOrder = async () => {
    const orderList = pastEventsList.map(item => String(item.id));
    const orderPayload = {
      id: "__indus3_past_events_order__",
      nombreEvento: "__indus3_past_events_order__",
      status: "draft",
      orderList
    };
    try {
      localStorage.setItem('indus3_past_events_order', JSON.stringify(orderList));
      const res = await fetch("https://api.indus3pro.com/eventos/save-event.php", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
        },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        alert("¡Orden de Eventos Pasados guardado con éxito! Recuerda hacer 'Publicar Cambios' para aplicarlo en el sitio público.");
        refreshData();
      } else {
        alert("Guardado en almacenamiento local (hubo un detalle al contactar el servidor).");
      }
    } catch (e) {
      console.error("Error saving order:", e);
      alert("Orden guardado en localStorage.");
    }
  };

  const handleTogglePastEvent = async (event) => {
    const nextEsPasado = !event.esPasado;
    const confirmMsg = nextEsPasado 
      ? `¿Deseas marcar "${event.nombreEvento}" como EVENTO PASADO?\n- Su fila se distinguirá con fondo gris claro y pasará al final de la tabla.\n- Su Flyer Vertical pasará automáticamente a ser de los primeros Eventos Pasados a mostrarse.\n- Se eliminará de los Sliders de inicio.`
      : `¿Deseas desmarcar "${event.nombreEvento}" como Evento Pasado? Volverá a la cartelera activa.`;
    if (!confirm(confirmMsg)) return;

    const updatedEvent = { ...event, esPasado: nextEsPasado };
    
    try {
      const res = await fetch("https://api.indus3pro.com/eventos/save-event.php", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
        },
        body: JSON.stringify(updatedEvent)
      });
      if (res.ok) {
        setEvents(prev => prev.map(ev => ev.id === event.id ? updatedEvent : ev));
        
        if (nextEsPasado) {
          const matchingSlider = sliders.find(s => 
            (s.title || '').toLowerCase().trim() === (event.nombreEvento || '').toLowerCase().trim()
          );
          if (matchingSlider) {
            await fetch('https://api.indus3pro.com/sliders/delete-slider.php', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
              },
              body: JSON.stringify({ id: matchingSlider.id })
            });
            setSliders(prev => prev.filter(s => s.id !== matchingSlider.id));
          }
        }
      } else {
        alert("Error al actualizar el evento en el servidor.");
      }
    } catch (err) {
      console.error("Error al cambiar estado de evento pasado:", err);
      alert("Error de red al actualizar el evento.");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const addNew = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleDeploy = async () => {
    if (!confirm('¿Deseas compilar y publicar los últimos cambios en la web pública? Esto tardará unos minutos en reflejarse.')) return;
    
    setIsDeploying(true);
    try {
      // Llama a tu backend PHP para que él ejecute la petición a GitHub de forma segura.
      const res = await fetch('https://api.indus3pro.com/trigger-deploy.php', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
        }
      });
      console.log({token: import.meta.env.PUBLIC_BACKEND_AUTH_KEY, res})
      const data = await res.json();
      console.log({data})
      if (res.ok) {
        alert('¡Despliegue iniciado correctamente! Los cambios estarán en vivo en unos minutos.');
      } else {
        alert('Hubo un error al iniciar el despliegue.');
      }
    } catch (e) {
      alert('Error de conexión al intentar desplegar.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('indus3_admin_session');
    window.location.href = '/admin';
  };

  if (!authorized) {
    return <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif' }}>Verificando credenciales...</div>;
  }

  return (
    <div className={styles.dashboard}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <span>Panel de Administración</span>
          <img src="/indus3-logo.webp" alt="Indus3" />
        </div>
        
        <nav className={styles.nav}>
          <div 
            className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span>Resumen</span>
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 'events' ? styles.active : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>Eventos</span>
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 'bios' ? styles.active : ''}`}
            onClick={() => setActiveTab('bios')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span>Biografías</span>
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 'sliders' ? styles.active : ''}`}
            onClick={() => setActiveTab('sliders')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span>Sliders de Inicio</span>
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 'pastEvents' ? styles.active : ''}`}
            onClick={() => setActiveTab('pastEvents')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Eventos Pasados</span>
          </div>
        </nav>

        <div className={styles.navItem} onClick={() => window.location.href = '/'}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span>Ir al Sitio</span>
        </div>
      </aside>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          <div className={styles.breadcrumb}>
            <span>Admin</span> / <span>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
          </div>
          <div className={styles.userArea}>
             <button 
               className={styles.btnPrimary} 
               onClick={handleDeploy} 
               disabled={isDeploying}
               style={{ marginRight: '15px', backgroundColor: isDeploying ? '#555' : '#10b981', border: 'none', color: 'white' }}
             >
               {isDeploying ? 'Publicando...' : 'Publicar Cambios'}
             </button>
             <button className={styles.logoutBtn} onClick={handleLogout}>Cerrar Sesión</button>
          </div>

        <main className={styles.main}>
          {/* OVERVIEW VIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className={styles.viewHeader}>
                <h1>Panel General</h1>
              </div>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statTitle}>Total Eventos</div>
                  <div className={styles.statValue}>{events.length}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statTitle}>Biografías</div>
                  <div className={styles.statValue}>{bios.length}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statTitle}>Sliders de Inicio</div>
                  <div className={styles.statValue}>{sliders.length}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statTitle}>Próximo Evento</div>
                  <div className={styles.statValue} style={{fontSize: '1.2rem', color: '#3b82f6'}}>
                    {events[0]?.nombreEvento || 'Ninguno'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EVENTS VIEW */}
          {activeTab === 'events' && (
            <div>
              <div className={styles.viewHeader}>
                <h1>Gestión de Eventos</h1>
                <button className={styles.btnPrimary} onClick={addNew}>
                  <span>+</span> Nuevo Evento
                </button>
              </div>
              
              <div className={styles.contentCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Fecha / Lugar</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events
                      .filter(e => e.id !== '__indus3_past_events_order__')
                      .slice()
                      .sort((a, b) => {
                        const aPasado = a.esPasado ? 1 : 0;
                        const bPasado = b.esPasado ? 1 : 0;
                        if (aPasado !== bPasado) return aPasado - bPasado;
                        return 0;
                      })
                      .map((event) => (
                      <tr
                        key={event.id}
                        className={event.status === 'draft' ? styles.draftRow : ''}
                        style={event.esPasado ? { backgroundColor: '#334155', opacity: 0.95 } : {}}
                      >
                        <td>
                          <div className={styles.itemInfo}>
                            <img src={event.flyerEvento || event.imagenBanner || event.imagenPR} className={styles.itemThumb} alt="" />
                            <div>
                              <span className={styles.itemName}>
                                {event.nombreEvento}
                                {event.status === 'draft' && <span className={styles.draftBadge}>Draft</span>}
                                {event.esPasado && (
                                  <span style={{
                                    marginLeft: '8px',
                                    backgroundColor: '#64748b',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '600'
                                  }}>
                                    Pasado
                                  </span>
                                )}
                              </span>
                              <span className={styles.itemMeta}>{event.identificacionEvento}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.itemName}>{event.fechaEvento}</div>
                          <div className={styles.itemMeta}>{event.lugarEvento}</div>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={styles.btnAction}
                              style={{ backgroundColor: event.esPasado ? '#64748b' : '#3b82f6', color: 'white', marginRight: '4px' }}
                              onClick={() => handleTogglePastEvent(event)}
                              title={event.esPasado ? "Quitar de Eventos Pasados" : "Marcar como Evento Pasado"}
                            >
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button className={`${styles.btnAction} ${styles.edit}`} onClick={() => handleEdit(event)}>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className={`${styles.btnAction} ${styles.delete}`} onClick={() => handleDelete('event', event.id)}>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BIOS VIEW */}
          {activeTab === 'bios' && (
            <div>
              <div className={styles.viewHeader}>
                <h1>Artistas y Biografías</h1>
                <button className={styles.btnPrimary} onClick={addNew}>
                  <span>+</span> Nueva Biografía
                </button>
              </div>

              <div className={styles.contentCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Perfil</th>
                      <th>Tipo / Ubicación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bios.length>0 && bios?.map((bio) => (
                      <tr key={bio.id} className={bio.status === 'draft' ? styles.draftRow : ''}>
                        <td>
                          <div className={styles.itemInfo}>
                            <img src={bio.squareImg} className={styles.itemThumb} alt="" />
                            <div>
                              <span className={styles.itemName}>
                                {bio.name}
                                {bio.status === 'draft' && <span className={styles.draftBadge}>Draft</span>}
                              </span>
                              <span className={styles.itemMeta}>{bio.jobTitle || 'Artista'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.itemName}>{bio.type}</div>
                          <div className={styles.itemMeta}>{bio.foundingLocation || bio.origin || 'Varios'}</div>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button className={`${styles.btnAction} ${styles.edit}`} onClick={() => handleEdit(bio)}>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className={`${styles.btnAction} ${styles.delete}`} onClick={() => handleDelete('bio', bio.id)}>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SLIDERS VIEW */}
          {activeTab === 'sliders' && (
            <div>
              <div className={styles.viewHeader}>
                <h1>Sliders de Inicio</h1>
                <button className={styles.btnPrimary} onClick={addNew}>
                  <span>+</span> Nuevo Slide
                </button>
              </div>

              <div className={styles.contentCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Slide</th>
                      <th>Orden</th>
                      <th>Botones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sliders.length>0 && [...sliders].sort((a,b) => (parseInt(a.order)||0) - (parseInt(b.order)||0)).map((slide) => (
                      <tr key={slide.id} className={slide.status === 'draft' ? styles.draftRow : ''}>
                        <td>
                          <div className={styles.itemInfo}>
                            <img src={slide.image} className={styles.itemThumb} alt="" style={{ objectFit: 'cover' }} />
                            <div>
                              <span className={styles.itemName}>
                                {slide.title}
                                {slide.status === 'draft' && <span className={styles.draftBadge}>Draft</span>}
                              </span>
                              <span className={styles.itemMeta}>{slide.fechaEvento || 'Sin fecha'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.itemMeta}>{slide.order || 0}</div>
                        </td>
                        <td>
                          <div className={styles.itemMeta}>{slide.actions?.length || 0} botón(es)</div>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button className={`${styles.btnAction} ${styles.edit}`} onClick={() => handleEdit(slide)}>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className={`${styles.btnAction} ${styles.delete}`} onClick={() => handleDelete('slider', slide.id)}>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAST EVENTS VIEW */}
          {activeTab === 'pastEvents' && (
            <div>
              <div className={styles.viewHeader}>
                <div>
                  <h1>Gestión de Eventos Pasados</h1>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
                    Organiza el orden en que aparecerán los eventos pasados en la sección de Cartelera de Eventos. Puedes reordenar usando los botones de posición.
                  </p>
                </div>
                <button
                  className={styles.btnPrimary}
                  onClick={savePastEventsOrder}
                  style={{ backgroundColor: '#10b981', border: 'none' }}
                >
                  Guardar Orden
                </button>
              </div>

              <div className={styles.contentCard} style={{ marginTop: '20px' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Orden</th>
                      <th>Evento Pasado</th>
                      <th>Origen</th>
                      <th style={{ textAlign: 'right' }}>Reordenar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastEventsList.map((item, index) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 'bold', color: '#94a3b8' }}>#{index + 1}</td>
                        <td>
                          <div className={styles.itemInfo}>
                            <img src={item.image} className={styles.itemThumb} alt="" style={{ objectFit: 'cover' }} />
                            <div>
                              <span className={styles.itemName}>{item.title}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            backgroundColor: item.category === 'Evento API' ? '#3b82f6' : '#475569',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {item.category || 'Eventos Pasados'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions} style={{ justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              className={styles.btnAction}
                              onClick={() => movePastEventToEdge(index, true)}
                              disabled={index === 0}
                              title="Mover al principio"
                              style={{ backgroundColor: '#334155', color: '#fff', opacity: index === 0 ? 0.3 : 1 }}
                            >
                              🔝
                            </button>
                            <button
                              className={styles.btnAction}
                              onClick={() => movePastEvent(index, -1)}
                              disabled={index === 0}
                              title="Subir"
                              style={{ backgroundColor: '#334155', color: '#fff', opacity: index === 0 ? 0.3 : 1 }}
                            >
                              ⬆️
                            </button>
                            <button
                              className={styles.btnAction}
                              onClick={() => movePastEvent(index, 1)}
                              disabled={index === pastEventsList.length - 1}
                              title="Bajar"
                              style={{ backgroundColor: '#334155', color: '#fff', opacity: index === pastEventsList.length - 1 ? 0.3 : 1 }}
                            >
                              ⬇️
                            </button>
                            <button
                              className={styles.btnAction}
                              onClick={() => movePastEventToEdge(index, false)}
                              disabled={index === pastEventsList.length - 1}
                              title="Mover al final"
                              style={{ backgroundColor: '#334155', color: '#fff', opacity: index === pastEventsList.length - 1 ? 0.3 : 1 }}
                            >
                              🔻
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pastEventsList.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          No hay eventos pasados disponibles para organizar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL OVERLAY */}
      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            <div style={{ padding: '20px' }}>
              {activeTab === 'events' ? (
                <EventForm eventToEdit={editingItem} onSuccess={refreshData} />
              ) : activeTab === 'sliders' ? (
                <SliderForm sliderToEdit={editingItem} onSuccess={refreshData} />
              ) : (
                <BioForm bioToEdit={editingItem} onSuccess={refreshData} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
