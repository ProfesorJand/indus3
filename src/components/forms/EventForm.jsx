import React, { useState, useEffect } from 'react';
import styles from './EventForm.module.css';

const EventForm = ({ eventToEdit = null, onSuccess }) => {
  const initialState = {
    id: '',
    nombreEvento: '',
    fechaEvento: '',
    descripcionEvento: '',
    imagenBanner: '',
    imagenPR: '',
    aperturaPuertas: '',
    comienzoShow: '',
    lugarEvento: '',
    flyerEvento: '',
    patrocinadores: [],
    preguntas:[],
    linkBiografia: '',
    restriccionesEdad: '',
    logisticaHigienicos: '',
    imagenTicketera: '',
    imagenBiografia: '',
    quienEsArtista: '',
    mejoresCanciones: [''], // Array for Spotify URLs
    historiaArtista: '',
    ventaEntradas: '',
    datosCuriosos: '',
    keywords: '' // Palabras clave para SEO. Ejemplo: "concierto, bad bunny, caracas, 2026, reggaeton"
  };

  const [formData, setFormData] = useState(eventToEdit || initialState);
  const [status, setStatus] = useState('');

  const handleFileUpload = async (e, fieldName, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!formData.nombreEvento) {
      alert("Por favor ingresa primero el nombre del evento para nombrar correctamente la imagen.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('name', formData.nombreEvento);
    uploadData.append('category', 'eventos');
    uploadData.append('type', type);

    setStatus('Subiendo imagen...');
    try {
      const res = await fetch('https://api.indus3pro.com/upload-image.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
        },
        body: uploadData
      });
      const data = await res.json();
      if (data.success) {
        if (fieldName.includes("-")) {
          const parts = fieldName.split("-");
          if (parts.length === 4) {
            const [arrayName, i, field, subI] = parts;
            const index = parseInt(i, 10);
            const subIndex = parseInt(subI, 10);
            setFormData(prev => {
              const updatedArray = [...prev[arrayName]];
              const subArray = [...(updatedArray[index][field] || [])];
              subArray[subIndex] = data.url;
              updatedArray[index] = { ...updatedArray[index], [field]: subArray };
              return { ...prev, [arrayName]: updatedArray };
            });
          } else if (parts.length === 3) {
            const [arrayName, i, field] = parts;
            const index = parseInt(i, 10);
            setFormData(prev => {
              const updatedArray = [...prev[arrayName]];
              updatedArray[index] = {
                ...updatedArray[index],
                [field]: data.url
              };
              return {
                ...prev,
                [arrayName]: updatedArray
              };
            });
          }
        } else {
          setFormData(prev => ({ ...prev, [fieldName]: data.url }));
        }
        setStatus('Imagen subida con éxito.');
      } else {
        setStatus('Error: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      setStatus('Error al conectar con el servidor de subida.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if(name === "id"){
      const nameWithoutSpace = value.replace(/\s/g, "-").toLowerCase();
      setFormData(prev => ({ ...prev, id: nameWithoutSpace }));
      return;
    }

    if (name.includes("-")) {
      const parts = name.split("-");

      if (parts.length === 4) {
        const [arrayName, i, field, subI] = parts;
        const index = parseInt(i, 10);
        const subIndex = parseInt(subI, 10);

        setFormData(prev => {
          const updatedArray = [...prev[arrayName]];
          const subArray = [...(updatedArray[index][field] || [])];
          subArray[subIndex] = value;
          updatedArray[index] = { ...updatedArray[index], [field]: subArray };

          return { ...prev, [arrayName]: updatedArray };
        });
      } else if (parts.length === 3) {
        const [arrayName, i, field] = parts;
        const index = parseInt(i, 10);

        setFormData(prev => {
          const updatedArray = [...prev[arrayName]];

          updatedArray[index] = {
            ...updatedArray[index],
            [field]: value
          };

          return {
            ...prev,
            [arrayName]: updatedArray
          };
        });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
      const urlSaveEvent = "https://api.indus3pro.com/eventos/save-event.php";
      const response = await fetch(urlSaveEvent, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log({data})
        setStatus('¡Excelente! Guardado con éxito.');
        if (onSuccess) onSuccess(); // Trigger refresh in parent
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
        if (onSuccess) onSuccess(); 
      }

      if (!eventToEdit) setFormData(initialState);
    } catch (error) {

      console.error(error);
      setStatus('Error al guardar el evento.');
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>{eventToEdit ? 'Editar Evento' : 'Agregar Nuevo Evento'}</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3>Información General</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Slug del evento (id)</label>
              <input type="text" name="id" value={formData.id} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Nombre del Evento</label>
              <input type="text" name="nombreEvento" value={formData.nombreEvento} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Fecha</label>
              <input type="text" name="fechaEvento" value={formData.fechaEvento} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label>Lugar</label>
              <input type="text" name="lugarEvento" value={formData.lugarEvento} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label>Apertura de Puertas</label>
              <input type="time" name="aperturaPuertas" value={formData.aperturaPuertas} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label>Comienzo del Show</label>
              <input type="time" name="comienzoShow" value={formData.comienzoShow} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label>Keywords SEO</label>
              {/* Ejemplo de cómo escribir las palabras clave:
                  "concierto, rock, caracas, indus3, 2026, dante gebel" (separadas por comas) */}
              <input 
                type="text" 
                name="keywords" 
                value={formData.keywords || ''} 
                onChange={handleChange} 
                placeholder="Ej: concierto, rock, caracas, 2026"
              />
            </div>
          </div>
          
          <div className={styles.field}>
            <label>Descripción del Evento</label>
            <textarea name="descripcionEvento" value={formData.descripcionEvento} onChange={handleChange} rows="4"></textarea>
          </div>

          <div className={styles.field}>
            <input type="text" name="imagenDespuesDescripcion" value={formData.imagenDespuesDescripcion} onChange={handleChange} placeholder="https://..." />
            <label className={styles.uploadBtn}>
              <input type="file" onChange={(e) => handleFileUpload(e, 'imagenDespuesDescripcion', 'vertical')} accept="image/*" style={{ display: 'none' }} />
              <span>Subir</span>
            </label>
          </div>
        </div>

        <div className={styles.section}>
          {/* seccion de preguntas y respuestas */}
          <h3>Preguntas y Respuestas</h3>
          {/* pregutas de referencias */}
          <div>
            <p>¿Qué es [NOMBRE DEL EVENTO]?</p>
            <p>¿Donde es [NOMBRE DEL EVENTO]?</p>
            <p>¿Cúando es el [NOMBRE DEL EVENTO]?</p>
            <p>¿Qué (artistas/Equipos) se presentan/compiten en [NOMBRE DEL EVENTO]?</p>
            <p>¿Quien hace [NOMBRE DEL EVENTO]?</p>
            <p>¿Cómo y dónde compro las entradas al [NOMBRE DEL EVENTO]?</p>
          </div>
          {/* boton de añadir pregunta */}
         <button type="button" onClick={() => setFormData(prev => ({ ...prev, preguntas: [...prev.preguntas, { pregunta: '', respuesta: '', imagenes: [], columnasImagenes: '1' }] }))}>Añadir Pregunta</button>
          {/* lista de preguntas */}
          {formData.preguntas.map((pregunta, index) => {
            const imagenes = pregunta.imagenes || (pregunta.imagen ? [pregunta.imagen] : []);
            
            return (
            <div key={index} className={styles.field} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <label>Pregunta</label>
              <input type="text" name={`preguntas-${index}-pregunta`} value={pregunta.pregunta} onChange={handleChange} />
              
              <label>Respuesta</label>
              <textarea name={`preguntas-${index}-respuesta`} value={pregunta.respuesta} onChange={handleChange} rows="4" ></textarea>
              
              <div style={{ marginTop: '1rem' }}>
                <label>Columnas para imágenes</label>
                <select name={`preguntas-${index}-columnasImagenes`} value={pregunta.columnasImagenes || '1'} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg-alt)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                  <option value="1">1 Columna</option>
                  <option value="2">2 Columnas</option>
                  <option value="3">3 Columnas</option>
                  <option value="4">4 Columnas</option>
                </select>
              </div>

              <label>Imágenes después de la respuesta</label>
              {imagenes.map((img, imgIndex) => (
                <div key={imgIndex} className={styles.inputWithButton} style={{ marginBottom: '10px' }}>
                  <input type="text" name={`preguntas-${index}-imagenes-${imgIndex}`} value={img} onChange={handleChange} placeholder="https://..." />
                  <label className={styles.uploadBtn}>
                    <input type="file" onChange={(e) => handleFileUpload(e, `preguntas-${index}-imagenes-${imgIndex}`, 'pregunta')} accept="image/*" style={{ display: 'none' }} />
                    <span>Subir</span>
                  </label>
                  <button type="button" onClick={() => {
                    setFormData(prev => {
                      const newPreguntas = [...prev.preguntas];
                      const currentImgs = [...(newPreguntas[index].imagenes || (newPreguntas[index].imagen ? [newPreguntas[index].imagen] : []))];
                      currentImgs.splice(imgIndex, 1);
                      newPreguntas[index] = { ...newPreguntas[index], imagenes: currentImgs, imagen: '' };
                      return { ...prev, preguntas: newPreguntas };
                    });
                  }}>Eliminar Imagen</button>
                </div>
              ))}
              <button type="button" onClick={() => {
                  setFormData(prev => {
                    const newPreguntas = [...prev.preguntas];
                    const currentImgs = [...(newPreguntas[index].imagenes || (newPreguntas[index].imagen ? [newPreguntas[index].imagen] : []))];
                    currentImgs.push('');
                    newPreguntas[index] = { ...newPreguntas[index], imagenes: currentImgs, imagen: '' };
                    return { ...prev, preguntas: newPreguntas };
                  });
              }}>+ Añadir Nueva Imagen a la Respuesta</button>

              <button type="button" onClick={() => setFormData(prev => ({ ...prev, preguntas: prev.preguntas.filter((_, i) => i !== index) }))} style={{ marginTop: '1.5rem', backgroundColor: '#dc3545' }}>Eliminar Pregunta Completa</button>
            </div>
          )})}
        </div>

        <div className={styles.section}>
          <h3>Multimedia y Links</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Imagen Banner (URL o Subir)</label>
              <div className={styles.inputWithButton}>
                <input type="text" name="imagenBanner" value={formData.imagenBanner} onChange={handleChange} placeholder="https://..." />
                <label className={styles.uploadBtn}>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'imagenBanner', 'banner')} accept="image/*" style={{ display: 'none' }} />
                  <span>Subir</span>
                </label>
              </div>
            </div>
            <div className={styles.field}>
              <label>Imagen PR (URL o Subir)</label>
              <div className={styles.inputWithButton}>
                <input type="text" name="imagenPR" value={formData.imagenPR} onChange={handleChange} placeholder="https://..." />
                <label className={styles.uploadBtn}>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'imagenPR', 'pr')} accept="image/*" style={{ display: 'none' }} />
                  <span>Subir</span>
                </label>
              </div>
            </div>
            <div className={styles.field}>
              <label>Flyer Vertical (URL o Subir)</label>
              <div className={styles.inputWithButton}>
                <input type="text" name="flyerEvento" value={formData.flyerEvento} onChange={handleChange} />
                <label className={styles.uploadBtn}>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'flyerEvento', 'flyer')} accept="image/*" style={{ display: 'none' }} />
                  <span>Subir</span>
                </label>
              </div>
            </div>
            <div className={styles.field}>
              <label>Imagen Ticketera (URL o Subir)</label>
              <div className={styles.inputWithButton}>
                <input type="text" name="imagenTicketera" value={formData.imagenTicketera} onChange={handleChange} />
                <label className={styles.uploadBtn}>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'imagenTicketera', 'ticketera')} accept="image/*" style={{ display: 'none' }} />
                  <span>Subir</span>
                </label>
              </div>
            </div>
            <div className={styles.field}>
              <label>Venta de Entradas (Link Externo)</label>
              <input type="url" name="ventaEntradas" value={formData.ventaEntradas} onChange={handleChange} placeholder="https://ticketera.com/..." />
            </div>
            {/*un boton de agregar url de imagenes de patrocinadores, donde se puede introducir un string (url) o una imagen desde la pc y pueda guardarse con el upload-image.php */}
            <div className={styles.field}>
              <label>Imagen Patrocinador (URL o Subir)</label>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, patrocinadores: [...prev.patrocinadores, { name: '', url: '' }] }))}>Añadir Patrocinador</button>
              {formData.patrocinadores.map((patrocinador, index) => (
                <div key={index} className="form-group">
                  <label>Nombre del Patrocinador {index + 1}</label>
                  <input type="text" name={`patrocinadores-${index}-name`} value={patrocinador.name} onChange={handleChange} />
                  <label>URL del Patrocinador {index + 1}</label>
                  <input type="text" name={`patrocinadores-${index}-url`} value={patrocinador.url} onChange={handleChange} />
                  <label className={styles.uploadBtn}>
                    <input type="file" onChange={(e) => handleFileUpload(e, `patrocinadores-${index}-url`, 'patrocinador')} accept="image/*" style={{ display: 'none' }} />
                    <span>Subir</span>
                  </label>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, patrocinadores: prev.patrocinadores.filter((_, i) => i !== index) }))}>Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Detalles del Artista</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Quién es el Artista</label>
              <textarea name="quienEsArtista" value={formData.quienEsArtista} onChange={handleChange}></textarea>
            </div>
            <div className={styles.field}>
              <label>Historia del Artista</label>
              <textarea name="historiaArtista" value={formData.historiaArtista} onChange={handleChange}></textarea>
            </div>
            <div className={styles.field}>
              <label>Imagen Biografía (URL o Subir)</label>
              <div className={styles.inputWithButton}>
                <input type="text" name="imagenBiografia" value={formData.imagenBiografia} onChange={handleChange} />
                <label className={styles.uploadBtn}>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'imagenBiografia', 'bio')} accept="image/*" style={{ display: 'none' }} />
                  <span>Subir</span>
                </label>
              </div>
            </div>
            <div className={styles.field}>
              <label>Link Biografía (ID o Slug)</label>
              <input type="text" name="linkBiografia" value={formData.linkBiografia} onChange={handleChange} placeholder="ej: artista-nombre" />
            </div>
          </div>
          
          <div className={styles.field}>
            <label>Datos Curiosos</label>
            <textarea name="datosCuriosos" value={formData.datosCuriosos} onChange={handleChange}></textarea>
          </div>

          {/* <div className={styles.field}>
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
                <button type="button" onClick={() => removeSpotifyUrl(index)} className={styles.btnRemove}>×</button>
              </div>
            ))}
            <button type="button" onClick={addSpotifyUrl} className={styles.btnAdd}>+ Agregar Canción</button>
          </div> */}
        </div>

        <div className={styles.section}>
          <h3>Logística y Otros</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Restricciones de Edad</label>
              <input type="text" name="restriccionesEdad" value={formData.restriccionesEdad} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.field}>
            <label>Logísticos del evento / Higiénicos (Mucha Información)</label>
            <textarea name="logisticaHigienicos" value={formData.logisticaHigienicos} onChange={handleChange} rows="6"></textarea>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.btnSubmit}>
            {eventToEdit ? 'Actualizar Evento' : 'Guardar Evento'}
          </button>
          {status && <p className={styles.status}>{status}</p>}
        </div>
      </form>
    </div>
  );
};

export default EventForm;
