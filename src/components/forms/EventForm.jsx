import React, { useState, useEffect } from 'react';
import styles from './EventForm.module.css';

const EventForm = ({ eventToEdit = null }) => {
  const initialState = {
    id: Date.now(),
    nombreEvento: '',
    fechaEvento: '',
    descripcionEvento: '',
    imagenBanner: '',
    imagenPR: '',
    identificacionEvento: '',
    aperturaPuertas: '',
    comienzoShow: '',
    lugarEvento: '',
    ventaEntradas: '',
    flyerEvento: '',
    patrocinadores: '',
    linkBiografia: '',
    restriccionesEdad: '',
    logisticaHigienicos: '',
    imagenTicketera: '',
    imagenBiografia: '',
    quienEsArtista: '',
    mejoresCanciones: [''], // Array for Spotify URLs
    historiaArtista: '',
    datosCuriosos: ''
  };

  const [formData, setFormData] = useState(eventToEdit || initialState);
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpotifyChange = (index, value) => {
    const newSongs = [...formData.mejoresCanciones];
    newSongs[index] = value;
    setFormData(prev => ({ ...prev, mejoresCanciones: newSongs }));
  };

  const addSpotifyUrl = () => {
    setFormData(prev => ({ ...prev, mejoresCanciones: [...prev.mejoresCanciones, ''] }));
  };

  const removeSpotifyUrl = (index) => {
    const newSongs = formData.mejoresCanciones.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, mejoresCanciones: newSongs }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Guardando...');

    try {
      // 1. Intentar guardar en el archivo local mediante la API (Solo funciona en desarrollo)
      const response = await fetch('/api/save-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus('¡Excelente! Guardado en src/data/events.json');
      } else {
        // 2. Backup en localStorage si la API no está disponible
        const existingEvents = JSON.parse(localStorage.getItem('indus3_events') || '[]');
        let updatedEvents;

        if (eventToEdit) {
          updatedEvents = existingEvents.map(ev => ev.id === formData.id ? formData : ev);
        } else {
          updatedEvents = [...existingEvents, { ...formData, id: Date.now() }];
        }

        localStorage.setItem('indus3_events', JSON.stringify(updatedEvents));
        console.log('Backup guardado en localStorage:', formData);
        setStatus('Guardado en LocalStorage (La API no respondió)');
      }

      if (!eventToEdit) setFormData(initialState);
    } catch (error) {

      console.error(error);
      setStatus('Error al guardar el evento.');
    }
  };

  return (
    <div class={styles.formContainer}>
      <h2 class={styles.formTitle}>{eventToEdit ? 'Editar Evento' : 'Agregar Nuevo Evento'}</h2>
      
      <form onSubmit={handleSubmit} class={styles.form}>
        <div class={styles.section}>
          <h3>Información General</h3>
          <div class={styles.grid}>
            <div class={styles.field}>
              <label>Nombre del Evento</label>
              <input type="text" name="nombreEvento" value={formData.nombreEvento} onChange={handleChange} required />
            </div>
            <div class={styles.field}>
              <label>Identificación (Artista/Festival)</label>
              <input type="text" name="identificacionEvento" value={formData.identificacionEvento} onChange={handleChange} required />
            </div>
            <div class={styles.field}>
              <label>Fecha</label>
              <input type="date" name="fechaEvento" value={formData.fechaEvento} onChange={handleChange} required />
            </div>
            <div class={styles.field}>
              <label>Lugar</label>
              <input type="text" name="lugarEvento" value={formData.lugarEvento} onChange={handleChange} required />
            </div>
            <div class={styles.field}>
              <label>Apertura de Puertas</label>
              <input type="time" name="aperturaPuertas" value={formData.aperturaPuertas} onChange={handleChange} />
            </div>
            <div class={styles.field}>
              <label>Comienzo del Show</label>
              <input type="time" name="comienzoShow" value={formData.comienzoShow} onChange={handleChange} />
            </div>
          </div>
          
          <div class={styles.field}>
            <label>Descripción del Evento</label>
            <textarea name="descripcionEvento" value={formData.descripcionEvento} onChange={handleChange} rows="4"></textarea>
          </div>
        </div>

        <div class={styles.section}>
          <h3>Multimedia y Links</h3>
          <div class={styles.grid}>
            <div class={styles.field}>
              <label>Imagen Banner (URL)</label>
              <input type="text" name="imagenBanner" value={formData.imagenBanner} onChange={handleChange} placeholder="https://..." />
            </div>
            <div class={styles.field}>
              <label>Imagen PR (URL)</label>
              <input type="text" name="imagenPR" value={formData.imagenPR} onChange={handleChange} placeholder="https://..." />
            </div>
            <div class={styles.field}>
              <label>Flyer Vertical (URL)</label>
              <input type="text" name="flyerEvento" value={formData.flyerEvento} onChange={handleChange} />
            </div>
            <div class={styles.field}>
              <label>Imagen Ticketera (URL)</label>
              <input type="text" name="imagenTicketera" value={formData.imagenTicketera} onChange={handleChange} />
            </div>
            <div class={styles.field}>
              <label>Venta de Entradas (Link Externo)</label>
              <input type="url" name="ventaEntradas" value={formData.ventaEntradas} onChange={handleChange} placeholder="https://ticketera.com/..." />
            </div>
            <div class={styles.field}>
              <label>Patrocinadores (URLs separadas por comas)</label>
              <input type="text" name="patrocinadores" value={formData.patrocinadores} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div class={styles.section}>
          <h3>Detalles del Artista</h3>
          <div class={styles.grid}>
            <div class={styles.field}>
              <label>Quién es el Artista</label>
              <textarea name="quienEsArtista" value={formData.quienEsArtista} onChange={handleChange}></textarea>
            </div>
            <div class={styles.field}>
              <label>Historia del Artista</label>
              <textarea name="historiaArtista" value={formData.historiaArtista} onChange={handleChange}></textarea>
            </div>
            <div class={styles.field}>
              <label>Imagen Biografía (URL)</label>
              <input type="text" name="imagenBiografia" value={formData.imagenBiografia} onChange={handleChange} />
            </div>
            <div class={styles.field}>
              <label>Link Biografía (ID o Slug)</label>
              <input type="text" name="linkBiografia" value={formData.linkBiografia} onChange={handleChange} placeholder="ej: artista-nombre" />
            </div>
          </div>
          
          <div class={styles.field}>
            <label>Datos Curiosos</label>
            <textarea name="datosCuriosos" value={formData.datosCuriosos} onChange={handleChange}></textarea>
          </div>

          <div class={styles.field}>
            <label>Mejores Canciones (Spotify Embed URLs)</label>
            {formData.mejoresCanciones.map((song, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  value={song} 
                  onChange={(e) => handleSpotifyChange(index, e.target.value)} 
                  placeholder="https://open.spotify.com/embed/track/..."
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={() => removeSpotifyUrl(index)} class={styles.btnRemove}>×</button>
              </div>
            ))}
            <button type="button" onClick={addSpotifyUrl} class={styles.btnAdd}>+ Agregar Canción</button>
          </div>
        </div>

        <div class={styles.section}>
          <h3>Logística y Otros</h3>
          <div class={styles.grid}>
            <div class={styles.field}>
              <label>Restricciones de Edad</label>
              <input type="text" name="restriccionesEdad" value={formData.restriccionesEdad} onChange={handleChange} />
            </div>
          </div>
          <div class={styles.field}>
            <label>Logísticos del evento / Higiénicos (Mucha Información)</label>
            <textarea name="logisticaHigienicos" value={formData.logisticaHigienicos} onChange={handleChange} rows="6"></textarea>
          </div>
        </div>

        <div class={styles.actions}>
          <button type="submit" class={styles.btnSubmit}>
            {eventToEdit ? 'Actualizar Evento' : 'Guardar Evento'}
          </button>
          {status && <p class={styles.status}>{status}</p>}
        </div>
      </form>
    </div>
  );
};

export default EventForm;
