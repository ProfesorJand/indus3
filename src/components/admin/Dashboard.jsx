import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import EventForm from '../forms/EventForm.jsx';
import BioForm from './BioForm.jsx';

const Dashboard = ({ initialEvents = [], initialBios = [] }) => {
  const [activeTab, setActiveTab] = useState('events'); // 'overview', 'events', 'bios'
  const [events, setEvents] = useState(initialEvents);
  const [bios, setBios] = useState(initialBios);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Re-fetch data helper
  const refreshData = async () => {
    try {
      // In a real app, we'd have GET endpoints. 
      // For now, since it's local dev, we could rely on props or re-read files if needed.
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('¿Estás seguro de eliminar este ítem?')) return;
    
    const endpoint = type === 'event' ? '/api/delete-event' : '/api/delete-bio';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        if (type === 'event') setEvents(prev => prev.filter(e => e.id !== id));
        else setBios(prev => prev.filter(b => b.id !== id));
      }
    } catch (e) { alert('Error al eliminar'); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const addNew = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  return (
    <div className={styles.dashboard}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <img src="/indus3/indus3-logo.webp" alt="Indus3" />
          <span>INDUS3 ADMIN</span>
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
        </nav>

        <div className={styles.navItem} onClick={() => window.location.href = '/'}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span>Ir al Sitio</span>
        </div>
      </aside>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className={styles.header}>
          <div className={styles.breadcrumb}>
            <span>Admin</span> / <span>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
          </div>
          <div className={styles.userArea}>
             <button className={styles.logoutBtn} onClick={() => window.location.href = '/admin'}>Cerrar Sesión</button>
          </div>
        </header>

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
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <div className={styles.itemInfo}>
                            <img src={event.imagenBanner} className={styles.itemThumb} alt="" />
                            <div>
                              <span className={styles.itemName}>{event.nombreEvento}</span>
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
                    {bios.map((bio) => (
                      <tr key={bio.id}>
                        <td>
                          <div className={styles.itemInfo}>
                            <img src={bio.squareImg} className={styles.itemThumb} alt="" />
                            <div>
                              <span className={styles.itemName}>{bio.name}</span>
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
        </main>
      </div>

      {/* MODAL OVERLAY */}
      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            <div style={{ padding: '20px' }}>
              {activeTab === 'events' ? (
                <EventForm eventToEdit={editingItem} />
              ) : (
                <BioForm bioToEdit={editingItem} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
