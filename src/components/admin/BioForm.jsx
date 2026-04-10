import React, { useState } from 'react';

const BioForm = () => {
  const [type, setType] = useState('artista');
  const [songs, setSongs] = useState([{ title: '', spotifyEmbed: '' }]);
  const [awards, setAwards] = useState(['']);

  const addSong = () => setSongs([...songs, { title: '', spotifyEmbed: '' }]);
  const addAward = () => setAwards([...awards, '']);

  return (
    <div className="admin-form-container">
      <form className="bio-form">
        <div className="form-section">
          <h2>Información Básica</h2>
          <div className="form-group">
            <label>Tipo de Biografía</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="artista">Artista</option>
              <option value="banda">Banda</option>
              <option value="evento">Evento</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre / Título</label>
              <input type="text" placeholder="Ej: Bad Bunny" />
            </div>
            <div className="form-group">
              <label>ID (Slug)</label>
              <input type="text" placeholder="ej: bad-bunny" />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción Corta</label>
            <textarea placeholder="Breve biografía..." rows={4}></textarea>
          </div>

          <div className="form-group">
            <label>URL Imagen Portada</label>
            <input type="text" placeholder="https://..." />
          </div>
        </div>

        <div className="form-section">
          <h2>Detalles Específicos ({type})</h2>
          {type === 'artista' && (
            <div className="form-grid">
              <div className="form-group"><label>Nombre Real</label><input type="text" /></div>
              <div className="form-group"><label>Fecha Nacimiento</label><input type="date" /></div>
              <div className="form-group"><label>Lugar Nacimiento</label><input type="text" /></div>
              <div className="form-group"><label>Estatura</label><input type="text" /></div>
              <div className="form-group"><label>Géneros (separados por coma)</label><input type="text" /></div>
            </div>
          )}
          {type === 'banda' && (
            <div className="form-grid">
              <div className="form-group"><label>Integrantes (separados por coma)</label><input type="text" /></div>
              <div className="form-group"><label>Lugar de Formación</label><input type="text" /></div>
              <div className="form-group"><label>Géneros (separados por coma)</label><input type="text" /></div>
            </div>
          )}
          {type === 'evento' && (
            <div className="form-grid">
              <div className="form-group"><label>Ubicación</label><input type="text" /></div>
              <div className="form-group"><label>Fecha del Evento</label><input type="date" /></div>
              <div className="form-group"><label>Organizador</label><input type="text" /></div>
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Canciones / Hits</h2>
            <button type="button" onClick={addSong} className="btn-add">+ Añadir</button>
          </div>
          {songs.map((_, idx) => (
            <div key={idx} className="form-row song-row">
              <input type="text" placeholder="Título" />
              <input type="text" placeholder="Spotify Embed URL" />
            </div>
          ))}
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Premios</h2>
            <button type="button" onClick={addAward} className="btn-add">+ Añadir</button>
          </div>
          {awards.map((_, idx) => (
            <div key={idx} className="form-group">
              <input type="text" placeholder="Nombre del premio..." />
            </div>
          ))}
        </div>

        <div className="form-section">
          <h2>Redes Sociales</h2>
          <div className="form-group">
            <label>Instagram Reel Link</label>
            <input type="text" placeholder="https://instagram.com/reel/..." />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">Guardar Biografía</button>
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
