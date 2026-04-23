import React, { useState } from 'react';

const BioForm = ({ bioToEdit = null }) => {
  const initialState = {
    id: bioToEdit?.id || Date.now(),
    type: bioToEdit?.type || 'artista',
    name: bioToEdit?.name || '',
    jobTitle: bioToEdit?.jobTitle || '',
    description: bioToEdit?.description || '',
    squareImg: bioToEdit?.squareImg || '',
    bannerImg: bioToEdit?.bannerImg || '',
    foundingLocation: bioToEdit?.foundingLocation || '',
    foundingDate: bioToEdit?.foundingDate || '',
    genre: bioToEdit?.genre || [],
    urlSpotify: bioToEdit?.urlSpotify || '',
    awards: bioToEdit?.awards || [''],
    instagramReelId: bioToEdit?.instagramReelId || ''
  };

  const [formData, setFormData] = useState(initialState);
  const [status, setStatus] = useState('');

  const handleFileUpload = async (e, fieldName, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!formData.name) {
      alert("Por favor ingresa primero el nombre para nombrar correctamente la imagen.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('name', formData.name);
    uploadData.append('category', 'biografias');
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
        setFormData(prev => ({ ...prev, [fieldName]: data.url }));
        setStatus('Imagen subida con éxito.');
      } else {
        setStatus('Error: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      setStatus('Error al conectar con el servidor.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Guardando...');
    try {
      const response = await fetch('/api/save-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) setStatus('¡Éxito! Guardado.');
      else setStatus('Error al guardar.');
    } catch (error) {
      console.error(error);
      setStatus('Error de conexión.');
    }
  };

  return (
    <div className="admin-form-container">
      <form className="bio-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Información Básica</h2>
          <div className="form-group">
            <label>Tipo de Biografía</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="artista">Artista</option>
              <option value="banda">Banda</option>
              <option value="evento">Evento</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre / Título</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Bad Bunny" />
            </div>
            <div className="form-group">
              <label>Puesto / Título Secundario</label>
              <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="Ej: Artista Musical" />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Breve biografía..." rows={4}></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Imagen Cuadrada (URL o Subir)</label>
              <div className="input-with-button">
                <input type="text" name="squareImg" value={formData.squareImg} onChange={handleChange} placeholder="https://..." />
                <label className="upload-btn">
                  <input type="file" onChange={(e) => handleFileUpload(e, 'squareImg', 'perfil')} accept="image/*" style={{ display: 'none' }} />
                  <span>Subir</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Imagen Banner (URL o Subir)</label>
              <div className="input-with-button">
                <input type="text" name="bannerImg" value={formData.bannerImg} onChange={handleChange} placeholder="https://..." />
                <label className="upload-btn">
                  <input type="file" onChange={(e) => handleFileUpload(e, 'bannerImg', 'banner')} accept="image/*" style={{ display: 'none' }} />
                  <span>Subir</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Detalles Específicos</h2>
          <div className="form-grid">
             <div className="form-group"><label>Ubicación</label><input type="text" name="foundingLocation" value={formData.foundingLocation} onChange={handleChange} /></div>
             <div className="form-group"><label>Fecha</label><input type="text" name="foundingDate" value={formData.foundingDate} onChange={handleChange} /></div>
             <div className="form-group"><label>URL Spotify Embed</label><input type="text" name="urlSpotify" value={formData.urlSpotify} onChange={handleChange} /></div>
             <div className="form-group"><label>Instagram Reel ID</label><input type="text" name="instagramReelId" value={formData.instagramReelId} onChange={handleChange} /></div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">Guardar Biografía</button>
          {status && <p style={{marginTop: '10px', color: '#007bff'}}>{status}</p>}
        </div>
      </form>

      <style jsx>{`
        .admin-form-container {
          max-width: 900px;
          margin: 0 auto;
          background: #111;
          color: white;
          padding: 40px;
          border-radius: 20px;
          border: 1px solid #333;
        }
        .bio-form {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .form-section h2 {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: #007bff;
          border-bottom: 1px solid #222;
          padding-bottom: 10px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #aaa;
        }
        .input-with-button {
          display: flex;
          gap: 10px;
        }
        .input-with-button input {
          flex: 1;
        }
        .upload-btn {
          background: #007bff;
          color: white;
          padding: 0 15px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          min-width: 70px;
        }
        .upload-btn:hover {
          background: #0056b3;
        }
        input, select, textarea {
          background: #222;
          border: 1px solid #444;
          padding: 12px;
          border-radius: 8px;
          color: white;
          font-family: inherit;
        }
        input:focus {
          border-color: #007bff;
          outline: none;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .section-header h2 { margin-bottom: 0; }
        .btn-add {
          background: #333;
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .song-row {
          margin-bottom: 10px;
        }
        .form-actions {
          padding-top: 20px;
          border-top: 1px solid #222;
        }
        .btn-submit {
          width: 100%;
          background: #007bff;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.3s;
        }
        .btn-submit:hover {
          background: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default BioForm;
