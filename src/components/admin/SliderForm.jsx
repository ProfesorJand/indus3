import React, { useState } from 'react';

const SliderForm = ({ sliderToEdit = null, onSuccess }) => {
  const initialState = {
    id: sliderToEdit?.id || Date.now().toString(),
    title: sliderToEdit?.title || '',
    description: sliderToEdit?.description || '',
    image: sliderToEdit?.image || '',
    fechaEvento: sliderToEdit?.fechaEvento || '',
    order: sliderToEdit?.order || 0,
    actions: sliderToEdit?.actions || []
  };

  const [formData, setFormData] = useState(initialState);
  const [status, setStatus] = useState('');

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!formData.title) {
      alert("Por favor ingresa primero el título del slide para nombrar correctamente la imagen.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('name', formData.title.replace(/\s+/g, '-').toLowerCase());
    uploadData.append('category', 'slider');
    uploadData.append('type', 'banner');

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

  const handleActionChange = (index, field, value) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { label: '', url: '', variant: 'primary', target: '_self' }]
    }));
  };

  const removeAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Guardando...');

    try {
      const urlSaveSlider = "https://api.indus3pro.com/sliders/save-slider.php";
      const response = await fetch(urlSaveSlider, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' ,
          'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setStatus('¡Éxito! Slide guardado.');
        if (onSuccess) onSuccess();
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
          <h2>Información del Slide</h2>

          <div className="form-group">
            <label>ID</label>
            <input type="text" name="id" value={formData.id} readOnly style={{ opacity: 0.7 }} />
          </div>

          <div className="form-group">
            <label>Título</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Ej: Road to VGS" required />
          </div>

          <div className="form-group">
            <label>Orden (0, 1, 2... menor número va primero)</label>
            <input type="number" name="order" value={formData.order} onChange={handleChange} placeholder="0" />
          </div>

          <div className="form-group">
            <label>Fecha Evento (Opcional)</label>
            <input type="text" name="fechaEvento" value={formData.fechaEvento} onChange={handleChange} placeholder="Ej: 20 de Octubre 2026" />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Breve descripción..." rows={3}></textarea>
          </div>

          <div className="form-group">
            <label>Imagen (URL o Subir)</label>
            <div className="input-with-button">
              <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="https://..." required />
              <label className="upload-btn">
                <input type="file" onChange={(e) => handleFileUpload(e, 'image')} accept="image/*" style={{ display: 'none' }} />
                <span>Subir</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Botones de Acción</h2>
          <button type="button" className="btn-add" onClick={addAction} style={{ marginBottom: '15px' }}>+ Añadir Botón</button>
          
          {formData.actions.map((action, index) => (
            <div key={index} className="action-card" style={{ background: '#222', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #444' }}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label>Texto del Botón</label>
                  <input type="text" value={action.label} onChange={(e) => handleActionChange(index, 'label', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>URL</label>
                  <input type="text" value={action.url} onChange={(e) => handleActionChange(index, 'url', e.target.value)} required />
                </div>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label>Tipo (Variante)</label>
                  <select value={action.variant} onChange={(e) => handleActionChange(index, 'variant', e.target.value)}>
                    <option value="primary">Primario (Destacado)</option>
                    <option value="secondary">Secundario (Normal)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Comportamiento (Target)</label>
                  <select value={action.target} onChange={(e) => handleActionChange(index, 'target', e.target.value)}>
                    <option value="_self">Misma Pestaña (_self)</option>
                    <option value="_blank">Nueva Pestaña (_blank)</option>
                  </select>
                </div>
              </div>
              <button type="button" onClick={() => removeAction(index)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar Botón</button>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">Guardar Slide</button>
          {status && <p style={{marginTop: '10px', color: '#007bff'}}>{status}</p>}
        </div>
      </form>

      <style>{`
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
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 15px;
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
        .btn-add {
          background: #333;
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
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

export default SliderForm;
