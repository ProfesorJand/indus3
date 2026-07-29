import React, { useState, useEffect } from 'react';
import styles from './EventForm.module.css';

const EventForm = ({ eventToEdit = null, onSuccess }) => {
  const initialState = {
    id: '',
    nombreEvento: '',
    fechaEvento: '',
    descripcionEvento: '',
    imagenDespuesDescripcion: '',
    videoDespuesDescripcion: '',
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
    keywords: '', // Palabras clave para SEO. Ejemplo: "concierto, bad bunny, caracas, 2026, reggaeton"
    
    // Campos del Schema (SEO)
    schemaActivo: false,
    schemaNombre: '',
    schemaDescripcion: '',
    schemaTipoFechaInicio: 'completa', // 'completa' o 'solo-fecha'
    schemaFechaInicioVal: '',
    schemaHoraInicioVal: '',
    schemaTimezoneInicio: '-04:00', // Default Venezuela
    schemaTipoFechaFin: 'completa',
    schemaFechaFinVal: '',
    schemaHoraFinVal: '',
    schemaTimezoneFin: '-04:00',
    schemaEventStatus: 'EventScheduled',
    schemaAttendanceMode: 'OfflineEventAttendanceMode',
    schemaPlaceName: '',
    schemaStreetAddress: '',
    schemaAddressLocality: 'Caracas',
    schemaPostalCode: '1060',
    schemaAddressRegion: 'Miranda',
    schemaAddressCountry: 'VE',
    schemaImagen1x1: '',
    schemaImagen4x3: '',
    schemaImagen16x9: '',
    schemaOfferUrl: '',
    schemaOfferPrice: '',
    schemaOfferPriceCurrency: 'USD',
    schemaOfferAvailability: 'InStock',
    schemaOfferValidFrom: '',
    schemaPerformerType: 'PerformingGroup',
    schemaPerformerName: '',
    schemaPerformers: [
      { type: 'PerformingGroup', name: '', sport: '', jobTitle: '' }
    ],
    schemaOrganizerName: 'Indus3',
    schemaOrganizerUrl: 'https://indus3pro.com',
    schemaOrganizers: [
      { name: 'Indus3', url: 'https://indus3pro.com' }
    ],
    schemaFechaInicio: '', // Campo consolidado final
    schemaFechaFin: '', // Campo consolidado final
    status: 'publicado'
  };

  const [formData, setFormData] = useState(() => {
    let baseData = initialState;
    if (eventToEdit) {
      baseData = { ...initialState, ...eventToEdit };
      if (eventToEdit.schemaPerformerName && (!eventToEdit.schemaPerformers || eventToEdit.schemaPerformers.length === 0)) {
        baseData.schemaPerformers = [
          {
            type: eventToEdit.schemaPerformerType || 'PerformingGroup',
            name: eventToEdit.schemaPerformerName,
            sport: '',
            jobTitle: ''
          }
        ];
      }
      if (!baseData.schemaOrganizers || baseData.schemaOrganizers.length === 0) {
        baseData.schemaOrganizers = [
          {
            name: baseData.schemaOrganizerName || 'Indus3',
            url: baseData.schemaOrganizerUrl || 'https://indus3pro.com'
          }
        ];
      }
    }
    return baseData;
  });
  const [status, setStatus] = useState('');

  const handleFileUpload = async (e, fieldName, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!formData.nombreEvento) {
      alert("Por favor ingresa primero el nombre del evento para nombrar correctamente la imagen o video.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('name', formData.nombreEvento);
    uploadData.append('category', 'eventos');
    uploadData.append('type', type);

    const isVideo = file.type.startsWith('video/') || type === 'video';
    setStatus(isVideo ? 'Subiendo video...' : 'Subiendo imagen...');
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
        setStatus(isVideo ? 'Video subido con éxito.' : 'Imagen subida con éxito.');
      } else {
        setStatus('Error: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      setStatus(isVideo ? 'Error al conectar con el servidor de subida de video.' : 'Error al conectar con el servidor de subida.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    if(name === "id"){
      const nameWithoutSpace = val.replace(/\s/g, "-").toLowerCase();
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
          subArray[subIndex] = val;
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
            [field]: val
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
        [name]: val
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

  const handlePerformerChange = (index, field, val) => {
    setFormData(prev => {
      const updated = [...(prev.schemaPerformers || [])];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, schemaPerformers: updated };
    });
  };

  const addPerformer = () => {
    setFormData(prev => ({
      ...prev,
      schemaPerformers: [...(prev.schemaPerformers || []), { type: 'PerformingGroup', name: '', sport: '', jobTitle: '' }]
    }));
  };

  const removePerformer = (index) => {
    setFormData(prev => ({
      ...prev,
      schemaPerformers: (prev.schemaPerformers || []).filter((_, i) => i !== index)
    }));
  };

  const handleOrganizerChange = (index, field, val) => {
    setFormData(prev => {
      const updated = [...(prev.schemaOrganizers || [])];
      updated[index] = { ...updated[index], [field]: val };
      
      const syncFields = {};
      if (index === 0) {
        if (field === 'name') syncFields.schemaOrganizerName = val;
        if (field === 'url') syncFields.schemaOrganizerUrl = val;
      }
      
      return { ...prev, schemaOrganizers: updated, ...syncFields };
    });
  };

  const addOrganizer = () => {
    setFormData(prev => ({
      ...prev,
      schemaOrganizers: [...(prev.schemaOrganizers || []), { name: '', url: '' }]
    }));
  };

  const removeOrganizer = (index) => {
    setFormData(prev => {
      const newOrganizers = (prev.schemaOrganizers || []).filter((_, i) => i !== index);
      const syncFields = {};
      if (index === 0 && newOrganizers.length > 0) {
        syncFields.schemaOrganizerName = newOrganizers[0].name;
        syncFields.schemaOrganizerUrl = newOrganizers[0].url;
      }
      return {
        ...prev,
        schemaOrganizers: newOrganizers,
        ...syncFields
      };
    });
  };

  const getFormattedSchemaDate = (tipo, dateVal, timeVal, timezone) => {
    if (!dateVal) return '';
    if (tipo === 'solo-fecha') {
      return dateVal;
    }
    if (!timeVal) {
      return `${dateVal}T00:00:00${timezone}`;
    }
    return `${dateVal}T${timeVal}:00${timezone}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Guardando...');

    // Consolidar fechas del schema antes de guardar
    const finalFormData = {
      ...formData,
      schemaFechaInicio: getFormattedSchemaDate(
        formData.schemaTipoFechaInicio,
        formData.schemaFechaInicioVal,
        formData.schemaHoraInicioVal,
        formData.schemaTimezoneInicio
      ),
      schemaFechaFin: getFormattedSchemaDate(
        formData.schemaTipoFechaFin,
        formData.schemaFechaFinVal,
        formData.schemaHoraFinVal,
        formData.schemaTimezoneFin
      )
    };

    try {
      // 1. Intentar guardar en el archivo local mediante la API (Solo funciona en desarrollo)
      const urlSaveEvent = "https://api.indus3pro.com/eventos/save-event.php";
      const response = await fetch(urlSaveEvent, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
        },
        body: JSON.stringify(finalFormData)
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
          updatedEvents = existingEvents.map(ev => ev.id === finalFormData.id ? finalFormData : ev);
        } else {
          updatedEvents = [...existingEvents, { ...finalFormData, id: Date.now() }];
        }

        localStorage.setItem('indus3_events', JSON.stringify(updatedEvents));
        console.log('Backup guardado en localStorage:', finalFormData);
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
            <label>Imagen Después de la Descripción (URL o Subir)</label>
            <div className={styles.inputWithButton}>
              <input type="text" name="imagenDespuesDescripcion" value={formData.imagenDespuesDescripcion || ''} onChange={handleChange} placeholder="https://..." />
              <label className={styles.uploadBtn}>
                <input type="file" onChange={(e) => handleFileUpload(e, 'imagenDespuesDescripcion', 'vertical')} accept="image/*" style={{ display: 'none' }} />
                <span>Subir</span>
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label>Video Después de la Descripción (MP4 u otros formatos)</label>
            <div className={styles.inputWithButton}>
              <input type="text" name="videoDespuesDescripcion" value={formData.videoDespuesDescripcion || ''} onChange={handleChange} placeholder="https://..." />
              <label className={styles.uploadBtn}>
                <input type="file" onChange={(e) => handleFileUpload(e, 'videoDespuesDescripcion', 'video')} accept="video/*" style={{ display: 'none' }} />
                <span>Subir</span>
              </label>
            </div>
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
              <input type="text" name="restriccionesEdad" value={formData.restriccionesEdad || ''} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.field}>
            <label>Logísticos del evento / Higiénicos (Mucha Información)</label>
            <textarea name="logisticaHigienicos" value={formData.logisticaHigienicos || ''} onChange={handleChange} rows="6"></textarea>
          </div>
        </div>

        {/* SECCION DEL SCHEMA EVENTO (SEO) */}
        {(() => {
          const previewSchemaInicio = getFormattedSchemaDate(
            formData.schemaTipoFechaInicio,
            formData.schemaFechaInicioVal,
            formData.schemaHoraInicioVal,
            formData.schemaTimezoneInicio
          );

          const previewSchemaFin = getFormattedSchemaDate(
            formData.schemaTipoFechaFin,
            formData.schemaFechaFinVal,
            formData.schemaHoraFinVal,
            formData.schemaTimezoneFin
          );

          const previewJSONLD = {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": formData.schemaNombre || formData.nombreEvento || "(Ejemplo: Concierto)",
            "description": formData.schemaDescripcion || formData.descripcionEvento || undefined,
            "startDate": previewSchemaInicio || undefined,
            "endDate": previewSchemaFin || undefined,
            "eventStatus": `https://schema.org/${formData.schemaEventStatus}`,
            "eventAttendanceMode": `https://schema.org/${formData.schemaAttendanceMode}`,
            "location": {
              "@type": "Place",
              "name": formData.schemaPlaceName || formData.lugarEvento || "(Ejemplo: Poliedro de Caracas)",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": formData.schemaStreetAddress || undefined,
                "addressLocality": formData.schemaAddressLocality || undefined,
                "addressRegion": formData.schemaAddressRegion || undefined,
                "postalCode": formData.schemaPostalCode || undefined,
                "addressCountry": formData.schemaAddressCountry || undefined
              }
            },
            "image": [
              formData.schemaImagen1x1,
              formData.schemaImagen4x3,
              formData.schemaImagen16x9
            ].filter(Boolean),
            "offers": {
              "@type": "Offer",
              "url": formData.schemaOfferUrl || formData.ventaEntradas || undefined,
              "price": formData.schemaOfferPrice ? Number(formData.schemaOfferPrice) : undefined,
              "priceCurrency": formData.schemaOfferPriceCurrency || "USD",
              "availability": `https://schema.org/${formData.schemaOfferAvailability}`,
              "validFrom": formData.schemaOfferValidFrom || undefined
            },
            "performer": (formData.schemaPerformers && formData.schemaPerformers.length > 0)
              ? formData.schemaPerformers.map(p => ({
                  "@type": p.type || 'PerformingGroup',
                  "name": p.name || '(Ejemplo: Participante)',
                  ...(p.type === 'SportsTeam' && p.sport ? { "sport": p.sport } : {}),
                  ...(p.type === 'Person' && p.jobTitle ? { "jobTitle": p.jobTitle } : {})
                }))
              : undefined,
            "organizer": (formData.schemaOrganizers && formData.schemaOrganizers.length > 0)
              ? formData.schemaOrganizers.map(org => ({
                  "@type": "Organization",
                  "name": org.name || "Indus3",
                  "url": org.url || "https://indus3pro.com"
                }))
              : {
                  "@type": "Organization",
                  "name": formData.schemaOrganizerName || "Indus3",
                  "url": formData.schemaOrganizerUrl || "https://indus3pro.com"
                }
          };

          const cleanObject = (obj) => {
            return Object.fromEntries(
              Object.entries(obj)
                .map(([k, v]) => {
                  if (v && typeof v === 'object' && !Array.isArray(v)) {
                    const cleanedSub = cleanObject(v);
                    return Object.keys(cleanedSub).length > 0 ? [k, cleanedSub] : null;
                  }
                  if (Array.isArray(v)) {
                    const filtered = v.filter(Boolean);
                    return filtered.length > 0 ? [k, filtered] : null;
                  }
                  return v !== undefined && v !== '' ? [k, v] : null;
                })
                .filter(Boolean)
            );
          };
          
          const cleanedPreview = cleanObject(previewJSONLD);

          return (
            <div className={styles.section} style={{ border: '2px solid rgba(169, 254, 0, 0.2)', padding: '2rem', borderRadius: '12px', background: 'rgba(169, 254, 0, 0.02)', marginTop: '2rem' }}>
              <h3 style={{ color: '#a9fe00', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Schema.org de Evento (SEO Especializado)</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', textTransform: 'none', color: '#fff' }}>
                  <input 
                    type="checkbox" 
                    name="schemaActivo" 
                    checked={formData.schemaActivo || false} 
                    onChange={handleChange} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#a9fe00' }}
                  />
                  Activar Schema Personalizado
                </label>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '-10px', marginBottom: '1.5rem' }}>
                Configure el markup estructurado JSON-LD para motores de búsqueda como Google. Los campos marcados con <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span> son altamente recomendados por Google para la correcta indexación y visualización del evento en los resultados de búsqueda enriquecidos.
              </p>

              {formData.schemaActivo && (
                <>
                  <div className={styles.grid}>
                    <div className={styles.field}>
                      <label>
                        Nombre del Evento (Schema) <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span>
                      </label>
                      <input 
                        type="text" 
                        name="schemaNombre" 
                        value={formData.schemaNombre || ''} 
                        onChange={handleChange} 
                        placeholder="Ej: Caramelos de Cianuro - Retro Tour Caracas" 
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', color: '#fff', marginBottom: '1rem' }}>
                        Participantes / Competidores / Elenco del Evento <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span>
                      </label>
                      
                      {(formData.schemaPerformers || []).map((performer, index) => (
                        <div key={index} style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          padding: '1.25rem', 
                          borderRadius: '8px', 
                          border: '1px solid rgba(255,255,255,0.05)', 
                          marginBottom: '1rem',
                          position: 'relative'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a9fe00', fontWeight: 'bold' }}>
                              Participante #{index + 1}
                            </span>
                            {(formData.schemaPerformers || []).length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removePerformer(index)}
                                style={{ 
                                  background: '#dc3545', 
                                  color: '#fff', 
                                  border: 'none', 
                                  borderRadius: '4px', 
                                  padding: '4px 8px', 
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Eliminar Participante
                              </button>
                            )}
                          </div>

                          <div className={styles.grid}>
                            <div className={styles.field}>
                              <label style={{ fontSize: '0.75rem' }}>Tipo de Participante</label>
                              <select 
                                value={performer.type || 'PerformingGroup'} 
                                onChange={(e) => handlePerformerChange(index, 'type', e.target.value)}
                              >
                                <option value="PerformingGroup">Grupo Musical (Banda, Dúo)</option>
                                <option value="Person">Persona / Solista (Cantante, Caster, Orador)</option>
                                <option value="SportsTeam">Equipo Deportivo (Club, Escuadra eSports)</option>
                              </select>
                            </div>

                            <div className={styles.field}>
                              <label style={{ fontSize: '0.75rem' }}>Nombre del Participante / Equipo / Artista</label>
                              <input 
                                type="text" 
                                value={performer.name || ''} 
                                onChange={(e) => handlePerformerChange(index, 'name', e.target.value)} 
                                placeholder="Ej: Panter Esports o Caramelos de Cianuro"
                              />
                            </div>

                            {performer.type === 'SportsTeam' && (
                              <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.75rem' }}>Disciplina / Videojuego (Sport)</label>
                                <input 
                                  type="text" 
                                  value={performer.sport || ''} 
                                  onChange={(e) => handlePerformerChange(index, 'sport', e.target.value)} 
                                  placeholder="Ej: League of Legends o Fútbol"
                                />
                              </div>
                            )}

                            {performer.type === 'Person' && (
                              <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.75rem' }}>Rol / Cargo (Job Title)</label>
                                <input 
                                  type="text" 
                                  value={performer.jobTitle || ''} 
                                  onChange={(e) => handlePerformerChange(index, 'jobTitle', e.target.value)} 
                                  placeholder="Ej: Esports Caster o Cantante Principal"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <button 
                        type="button" 
                        onClick={addPerformer}
                        style={{ 
                          background: 'rgba(169, 254, 0, 0.1)', 
                          color: '#a9fe00', 
                          border: '1px dashed #a9fe00', 
                          borderRadius: '8px', 
                          padding: '10px 15px', 
                          width: '100%', 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          marginTop: '0.5rem',
                          textAlign: 'center'
                        }}
                      >
                        + Añadir Otro Participante / Competidor (eSports, Bandas, Casters)
                      </button>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Descripción para Buscadores (Schema) <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span></label>
                    <textarea 
                      name="schemaDescripcion" 
                      value={formData.schemaDescripcion || ''} 
                      onChange={handleChange} 
                      rows="3" 
                      placeholder="Ej: El regreso más esperado del rock venezolano. Caramelos de Cianuro en vivo en la Terraza del CCCT, Caracas. Entradas a la venta ya."
                    ></textarea>
                  </div>

                  <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '2rem 0 1rem' }}>Fechas del Evento para SEO</h4>
                  
                  <div className={styles.grid}>
                    {/* FECHA INICIO */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', color: '#a9fe00', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                        Fecha de Inicio <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span>
                      </label>
                      
                      <div className={styles.field}>
                        <label style={{ fontSize: '0.75rem' }}>Tipo de Formato</label>
                        <select name="schemaTipoFechaInicio" value={formData.schemaTipoFechaInicio || 'completa'} onChange={handleChange}>
                          <option value="completa">Fecha, Hora y Zona Horaria (Recomendado)</option>
                          <option value="solo-fecha">Solo Fecha (Todo el día / Sin Hora)</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label style={{ fontSize: '0.75rem' }}>Fecha</label>
                        <input 
                          type="date" 
                          name="schemaFechaInicioVal" 
                          value={formData.schemaFechaInicioVal || ''} 
                          onChange={handleChange} 
                        />
                      </div>

                      {formData.schemaTipoFechaInicio === 'completa' && (
                        <>
                          <div className={styles.field}>
                            <label style={{ fontSize: '0.75rem' }}>Hora de Inicio (VET)</label>
                            <input 
                              type="time" 
                              name="schemaHoraInicioVal" 
                              value={formData.schemaHoraInicioVal || ''} 
                              onChange={handleChange} 
                            />
                          </div>

                          <div className={styles.field}>
                            <label style={{ fontSize: '0.75rem' }}>Zona Horaria (Timezone)</label>
                            <select name="schemaTimezoneInicio" value={formData.schemaTimezoneInicio || '-04:00'} onChange={handleChange}>
                              <option value="-04:00">Venezuela (UTC-4 / VET - Caracas)</option>
                              <option value="-05:00">Colombia, Perú, Panamá (UTC-5 / COT)</option>
                              <option value="-03:00">Argentina, Chile, Uruguay (UTC-3 / ART)</option>
                              <option value="-04:00">EE.UU. Este (Miami, NY - UTC-4 / EDT)</option>
                              <option value="-06:00">México (UTC-6 / CST)</option>
                              <option value="+00:00">UTC / GMT</option>
                            </select>
                          </div>
                        </>
                      )}

                      <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.75rem', color: '#888' }}>
                        Preview ISO: <code style={{ color: '#a9fe00' }}>{previewSchemaInicio || 'Pendiente...'}</code>
                      </div>
                    </div>

                    {/* FECHA FIN */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', color: '#a9fe00', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                        Fecha de Finalización <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span>
                      </label>

                      <div className={styles.field}>
                        <label style={{ fontSize: '0.75rem' }}>Tipo de Formato</label>
                        <select name="schemaTipoFechaFin" value={formData.schemaTipoFechaFin || 'completa'} onChange={handleChange}>
                          <option value="completa">Fecha, Hora y Zona Horaria (Recomendado)</option>
                          <option value="solo-fecha">Solo Fecha (Todo el día / Sin Hora)</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label style={{ fontSize: '0.75rem' }}>Fecha</label>
                        <input 
                          type="date" 
                          name="schemaFechaFinVal" 
                          value={formData.schemaFechaFinVal || ''} 
                          onChange={handleChange} 
                        />
                      </div>

                      {formData.schemaTipoFechaFin === 'completa' && (
                        <>
                          <div className={styles.field}>
                            <label style={{ fontSize: '0.75rem' }}>Hora de Finalización (VET)</label>
                            <input 
                              type="time" 
                              name="schemaHoraFinVal" 
                              value={formData.schemaHoraFinVal || ''} 
                              onChange={handleChange} 
                            />
                          </div>

                          <div className={styles.field}>
                            <label style={{ fontSize: '0.75rem' }}>Zona Horaria (Timezone)</label>
                            <select name="schemaTimezoneFin" value={formData.schemaTimezoneFin || '-04:00'} onChange={handleChange}>
                              <option value="-04:00">Venezuela (UTC-4 / VET - Caracas)</option>
                              <option value="-05:00">Colombia, Perú, Panamá (UTC-5 / COT)</option>
                              <option value="-03:00">Argentina, Chile, Uruguay (UTC-3 / ART)</option>
                              <option value="-04:00">EE.UU. Este (Miami, NY - UTC-4 / EDT)</option>
                              <option value="-06:00">México (UTC-6 / CST)</option>
                              <option value="+00:00">UTC / GMT</option>
                            </select>
                          </div>
                        </>
                      )}

                      <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.75rem', color: '#888' }}>
                        Preview ISO: <code style={{ color: '#a9fe00' }}>{previewSchemaFin || 'Pendiente...'}</code>
                      </div>
                    </div>
                  </div>

                  <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '2rem 0 1rem' }}>Estado y Modalidad</h4>
                  
                  <div className={styles.grid}>
                    <div className={styles.field}>
                      <label>Estado del Evento</label>
                      <select name="schemaEventStatus" value={formData.schemaEventStatus || 'EventScheduled'} onChange={handleChange}>
                        <option value="EventScheduled">Programado (Scheduled)</option>
                        <option value="EventCancelled">Cancelado (Cancelled)</option>
                        <option value="EventPostponed">Pospuesto (Postponed)</option>
                        <option value="EventRescheduled">Reprogramado (Rescheduled)</option>
                        <option value="EventMovedOnline">Movido a Online (Moved Online)</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label>Modalidad de Asistencia</label>
                      <select name="schemaAttendanceMode" value={formData.schemaAttendanceMode || 'OfflineEventAttendanceMode'} onChange={handleChange}>
                        <option value="OfflineEventAttendanceMode">Presencial (Físico / Offline)</option>
                        <option value="OnlineEventAttendanceMode">En Línea (Virtual / Online)</option>
                        <option value="MixedEventAttendanceMode">Mixto (Híbrido / Presencial y Virtual)</option>
                      </select>
                    </div>
                  </div>

                  <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '2rem 0 1rem' }}>Lugar y Dirección Detallada (Físico)</h4>
                  
                  <div className={styles.grid}>
                    <div className={styles.field}>
                      <label>Nombre del Lugar <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span></label>
                      <input 
                        type="text" 
                        name="schemaPlaceName" 
                        value={formData.schemaPlaceName || ''} 
                        onChange={handleChange} 
                        placeholder="Ej: Terraza del CCCT" 
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Dirección (Calle/Av) <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span></label>
                      <input 
                        type="text" 
                        name="schemaStreetAddress" 
                        value={formData.schemaStreetAddress || ''} 
                        onChange={handleChange} 
                        placeholder="Ej: Av. La Estancia, Chuao" 
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Ciudad / Localidad</label>
                      <input 
                        type="text" 
                        name="schemaAddressLocality" 
                        value={formData.schemaAddressLocality || ''} 
                        onChange={handleChange} 
                        placeholder="Ej: Caracas" 
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Estado / Provincia</label>
                      <input 
                        type="text" 
                        name="schemaAddressRegion" 
                        value={formData.schemaAddressRegion || ''} 
                        onChange={handleChange} 
                        placeholder="Ej: Miranda o Distrito Capital" 
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Código Postal</label>
                      <input 
                        type="text" 
                        name="schemaPostalCode" 
                        value={formData.schemaPostalCode || ''} 
                        onChange={handleChange} 
                        placeholder="Ej: 1060" 
                      />
                    </div>

                    <div className={styles.field}>
                      <label>País (Código ISO 2 Letras)</label>
                      <input 
                        type="text" 
                        name="schemaAddressCountry" 
                        value={formData.schemaAddressCountry || ''} 
                        onChange={handleChange} 
                        placeholder="Ej: VE" 
                      />
                    </div>
                  </div>

                  <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '2rem 0 1rem' }}>Imágenes del Schema (Aspect Ratios Recomendados)</h4>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '-5px', marginBottom: '1rem' }}>
                    Google recomienda proveer imágenes en proporciones 1:1, 4:3 y 16:9 para adaptarse a diferentes dispositivos.
                  </p>

                  <div className={styles.field}>
                    <label>Imagen 1x1 (Proporción Cuadrada) <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span></label>
                    <div className={styles.inputWithButton}>
                      <input 
                        type="text" 
                        name="schemaImagen1x1" 
                        value={formData.schemaImagen1x1 || ''} 
                        onChange={handleChange} 
                        placeholder="https://..." 
                      />
                      <label className={styles.uploadBtn}>
                        <input 
                          type="file" 
                          onChange={(e) => handleFileUpload(e, 'schemaImagen1x1', 'schema')} 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                        />
                        <span>Subir</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Imagen 4x3 (Proporción Estándar)</label>
                    <div className={styles.inputWithButton}>
                      <input 
                        type="text" 
                        name="schemaImagen4x3" 
                        value={formData.schemaImagen4x3 || ''} 
                        onChange={handleChange} 
                        placeholder="https://..." 
                      />
                      <label className={styles.uploadBtn}>
                        <input 
                          type="file" 
                          onChange={(e) => handleFileUpload(e, 'schemaImagen4x3', 'schema')} 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                        />
                        <span>Subir</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Imagen 16x9 (Proporción Panorámica)</label>
                    <div className={styles.inputWithButton}>
                      <input 
                        type="text" 
                        name="schemaImagen16x9" 
                        value={formData.schemaImagen16x9 || ''} 
                        onChange={handleChange} 
                        placeholder="https://..." 
                      />
                      <label className={styles.uploadBtn}>
                        <input 
                          type="file" 
                          onChange={(e) => handleFileUpload(e, 'schemaImagen16x9', 'schema')} 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                        />
                        <span>Subir</span>
                      </label>
                    </div>
                  </div>

                  <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '2rem 0 1rem' }}>Oferta y Venta de Entradas</h4>
                  
                  <div className={styles.grid}>
                    <div className={styles.field}>
                      <label>URL de Compra de Entradas <span style={{ color: '#ff4444', fontWeight: 'bold' }}>(*)</span></label>
                      <input 
                        type="url" 
                        name="schemaOfferUrl" 
                        value={formData.schemaOfferUrl || ''} 
                        onChange={handleChange} 
                        placeholder="Ej: https://ticketera.com/eventos/caramelos-de-cianuro" 
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Precio Mínimo de Entrada</label>
                      <input 
                        type="number" 
                        step="0.01"
                        name="schemaOfferPrice" 
                        value={formData.schemaOfferPrice || ''} 
                        onChange={handleChange} 
                        placeholder="Ej: 30" 
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Moneda (ISO Currency)</label>
                      <input 
                        type="text" 
                        name="schemaOfferPriceCurrency" 
                        value={formData.schemaOfferPriceCurrency || 'USD'} 
                        onChange={handleChange} 
                        placeholder="Ej: USD" 
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Disponibilidad</label>
                      <select name="schemaOfferAvailability" value={formData.schemaOfferAvailability || 'InStock'} onChange={handleChange}>
                        <option value="InStock">En Stock (In Stock)</option>
                        <option value="SoldOut">Agotado (Sold Out)</option>
                        <option value="PreOrder">Preventa (Pre Order)</option>
                        <option value="OutOfStock">Fuera de Stock (Out Of Stock)</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label>Venta disponible desde</label>
                      <input 
                        type="date" 
                        name="schemaOfferValidFrom" 
                        value={formData.schemaOfferValidFrom || ''} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>

                  <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '2rem 0 1rem' }}>Organizadores del Evento</h4>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    {(formData.schemaOrganizers || []).map((organizer, index) => (
                      <div key={index} style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        padding: '1.25rem', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        marginBottom: '1rem',
                        position: 'relative'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a9fe00', fontWeight: 'bold' }}>
                            Organizador #{index + 1}
                          </span>
                          {(formData.schemaOrganizers || []).length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeOrganizer(index)}
                              style={{ 
                                background: '#dc3545', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '4px', 
                                padding: '4px 8px', 
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Eliminar Organizador
                            </button>
                          )}
                        </div>

                        <div className={styles.grid}>
                          <div className={styles.field}>
                            <label style={{ fontSize: '0.75rem' }}>Nombre del Organizador</label>
                            <input 
                              type="text" 
                              value={organizer.name || ''} 
                              onChange={(e) => handleOrganizerChange(index, 'name', e.target.value)} 
                              placeholder="Ej: Indus3"
                            />
                          </div>

                          <div className={styles.field}>
                            <label style={{ fontSize: '0.75rem' }}>URL del Organizador</label>
                            <input 
                              type="url" 
                              value={organizer.url || ''} 
                              onChange={(e) => handleOrganizerChange(index, 'url', e.target.value)} 
                              placeholder="Ej: https://indus3pro.com"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button 
                      type="button" 
                      onClick={addOrganizer}
                      style={{ 
                        background: 'rgba(169, 254, 0, 0.1)', 
                        color: '#a9fe00', 
                        border: '1px dashed #a9fe00', 
                        borderRadius: '8px', 
                        padding: '10px 15px', 
                        width: '100%', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginTop: '0.5rem',
                        textAlign: 'center'
                      }}
                    >
                      + Añadir Otro Organizador
                    </button>
                  </div>

                  {/* LIVE SCHEMA PREVIEW */}
                  <h4 style={{ color: '#a9fe00', borderBottom: '1px solid rgba(169, 254, 0, 0.2)', paddingBottom: '0.5rem', margin: '2.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#a9fe00', borderRadius: '50%' }}></span>
                    Previsualización en tiempo real del JSON-LD (SEO)
                  </h4>
                  <div style={{ position: 'relative', marginTop: '1rem' }}>
                    <pre style={{ 
                      background: 'rgba(0, 0, 0, 0.4)', 
                      padding: '1.25rem', 
                      borderRadius: '8px', 
                      color: '#a9fe00', 
                      overflowX: 'auto', 
                      fontSize: '0.85rem',
                      border: '1px solid rgba(169, 254, 0, 0.1)',
                      fontFamily: 'Consolas, Monaco, monospace',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {JSON.stringify(cleanedPreview, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        <div className={styles.section}>
          <h3>Estado de Publicación</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Estado del Evento</label>
              <select name="status" value={formData.status || 'publicado'} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="publicado">Publicado</option>
                <option value="draft">Borrador (Draft)</option>
              </select>
            </div>
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
