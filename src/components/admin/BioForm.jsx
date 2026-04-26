import React, { useState } from 'react';
import { JOB_TITLE, TYPE, GENRE, ROL } from '@stores/biografias';

const BioForm = ({ bioToEdit = null, onSuccess }) => {
  const initialState = {
    id: bioToEdit?.id || Date.now(),
    type: bioToEdit?.type || TYPE[0],
    name: bioToEdit?.name || '',
    jobTitle: bioToEdit?.jobTitle || '',
    description: Array.isArray(bioToEdit?.description) 
      ? bioToEdit.description.join('\n') 
      : bioToEdit?.description || '',
    squareImg: bioToEdit?.squareImg || '',
    bannerImg: bioToEdit?.bannerImg || '',
    foundingLocation: bioToEdit?.foundingLocation || '',
    foundingDate: bioToEdit?.foundingDate || '',
    genre: bioToEdit?.genre || [],
    members: bioToEdit?.members || [],
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

    // Convertimos el string del textarea en un array de párrafos para el JSON
    const payload = {
      ...formData,
      description: formData.description
        .split('\n')
        .map(p => p.trim())
        .filter(p => p !== '')
    };

    try {
      const urlSaveBio = "https://api.indus3pro.com/biografias/save-bio.php";
      const response = await fetch(urlSaveBio, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' ,
          'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
        },
        body: JSON.stringify(payload)
      });
      if (response.success) {
        setStatus('¡Éxito! Guardado.');
        if (onSuccess) onSuccess(); // Trigger refresh in parent
      }
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
              {TYPE.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Slug</label>
              <input type="text" name="id" value={formData.id} onChange={handleChange} placeholder="Ej: bad-bunny" />
            </div>
            <div className="form-group">
              <label>Nombre / Título</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Bad Bunny" />
            </div>
            <div className="form-group">
              <label>Etiqueta</label>
              <select name="jobTitle" value={formData.jobTitle} onChange={handleChange}>
                {JOB_TITLE.map(jobTitle => (
                  <option key={jobTitle} value={jobTitle}>{jobTitle}</option>
                ))}
              </select>
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
              <label>Imagen Banner Horizontal (URL o Subir)</label>
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
             <div className="form-group">
              <label>Género</label>
              <select name="genre" value={formData.genre} onChange={handleChange}>
                {GENRE.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
             </div>
             {/* si el jobTitle es banda o duo mostrar los campos de miembros */}
             {(formData.jobTitle === JOB_TITLE[1] || formData.jobTitle === JOB_TITLE[2]) && (
              <div className="form-group">
                <label>Miembros</label>
                {/* boton para añadir miembro y despues poder añadir sus campos de name y rol y debe tener boton tambien para eliminar*/}
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, members: [...prev.members, { name: '', rol: '' }] }))}>Añadir Miembro</button>
                {/* crear un div con cantidad de inputs para los miembros */}
                {formData.members.map((member, index) => (
                  <div key={index} className="form-group">
                    <label>Miembro {index + 1}</label>
                    <input type="text" name={`member-${index}`} value={member.name} onChange={handleChange} />
                    <select name={`rol-${index}`} value={member.rol} onChange={handleChange}>
                      {ROL.map(rol => (
                        <option key={rol} value={rol}>{rol}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, members: prev.members.filter((_, i) => i !== index) }))}>Eliminar</button>
                  </div>
                ))}
              </div>
             )}
             <div className="form-group"><label>Premios / Awards</label>
             {/* boton para añadir premios donde solo tendra string y debe tener boton para eliminar tambien*/}
             <button type="button" onClick={() => setFormData(prev => ({ ...prev, awards: [...prev.awards, ''] }))}>Añadir Premio</button>
             {formData.awards.map((award, index) => (
              <div key={index} className="form-group">
                <label>Premio {index + 1}</label>
                <input type="text" name={`award-${index}`} value={award} onChange={handleChange} />
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, awards: prev.awards.filter((_, i) => i !== index) }))}>Eliminar</button>
              </div>
             ))}
             </div>
             
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
