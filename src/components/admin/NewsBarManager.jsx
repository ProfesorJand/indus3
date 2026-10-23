import React, { useState, useEffect } from 'react';
import styles from './NewsBarManager.module.css';
import NewsBar from '../base/NewsBar.jsx';
import { saveNewsConfig, getNewsConfig, deleteNewsItem } from '../../stores/news.js';
import { renderFormattedNewsText } from '../../utils/newsFormatter.jsx';

const separatorPresets = [
  { label: '✦ Diamante (Recomendado)', value: '✦' },
  { label: '• Punto Clásico', value: '•' },
  { label: '🔥 Fuego', value: '🔥' },
  { label: '⚡ Rayo', value: '⚡' },
  { label: '★ Estrella', value: '★' },
  { label: '| Barra vertical', value: '|' },
];

const defaultEmptyConfig = {
  enabled: true,
  badgeText: 'NOTICIAS',
  speed: 'normal',
  separator: '✦',
  spacing: 'double',
  items: []
};

export default function NewsBarManager({ initialData = null, onSaved = null }) {
  const [config, setConfig] = useState(() => {
    if (initialData && Array.isArray(initialData.items)) return initialData;
    return defaultEmptyConfig;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' });

  // On mount, load fresh version from MySQL database via PHP API
  useEffect(() => {
    getNewsConfig().then((freshData) => {
      if (freshData && Array.isArray(freshData.items)) {
        setConfig(freshData);
      }
    }).catch((e) => {
      console.warn("Error loading news in manager:", e);
    });
  }, []);

  // Sync if initialData changes
  useEffect(() => {
    if (initialData && initialData.items) {
      setConfig(initialData);
    }
  }, [initialData]);

  const handleGlobalChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setConfig((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    const newItem = {
      id: `news-${Date.now()}`,
      text: '',
      url: '',
      openInNewTab: false,
      enabled: true,
      clicks: 0
    };
    setConfig((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItem = async (index) => {
    const item = config.items[index];
    if (!confirm(`¿Estás seguro de eliminar la noticia #${index + 1}?`)) return;

    if (item && item.id && !isNaN(item.id)) {
      try {
        await deleteNewsItem(item.id);
      } catch (err) {
        console.warn("Se confirmará la eliminación al guardar:", err);
      }
    }

    setConfig((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleMoveItem = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= config.items.length) return;
    setConfig((prev) => {
      const newItems = [...prev.items];
      const [moved] = newItems.splice(index, 1);
      newItems.splice(targetIndex, 0, moved);
      return { ...prev, items: newItems };
    });
  };

  const handleWrapText = (index, openTag, closeTag) => {
    const textarea = document.getElementById(`news-textarea-${index}`);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value || '';
    const selectedText = currentVal.substring(start, end);

    let newText = '';
    let selectionOffset = 0;
    let selectionLen = 0;

    if (selectedText.length > 0) {
      const leadSpace = selectedText.match(/^\s*/)[0];
      const trailSpace = selectedText.match(/\s*$/)[0];
      const trimmed = selectedText.trim();

      newText = currentVal.substring(0, start) + leadSpace + openTag + trimmed + closeTag + trailSpace + currentVal.substring(end);
      selectionOffset = start + leadSpace.length + openTag.length;
      selectionLen = trimmed.length;
    } else {
      const placeholder = 'texto';
      newText = currentVal.substring(0, start) + openTag + placeholder + closeTag + currentVal.substring(end);
      selectionOffset = start + openTag.length;
      selectionLen = placeholder.length;
    }

    handleItemChange(index, 'text', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionOffset, selectionOffset + selectionLen);
    }, 15);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage({ text: 'Guardando noticias...', type: 'info' });

    try {
      const res = await saveNewsConfig(config);
      setIsSaving(false);
      if (res && res.data && Array.isArray(res.data)) {
        setConfig((prev) => ({ ...prev, items: res.data }));
      }
      setStatusMessage({
        text: '¡Configuración de la Barra de Noticias guardada con éxito en la base de datos!',
        type: 'success',
      });

      if (onSaved) onSaved(config);

      setTimeout(() => {
        setStatusMessage({ text: '', type: 'info' });
      }, 5000);
    } catch (err) {
      console.error('Error saving news config:', err);
      setIsSaving(false);
      setStatusMessage({
        text: 'Hubo un error al guardar en el servidor. Los cambios se guardaron localmente.',
        type: 'error',
      });
    }
  };

  return (
    <div className={styles.manager}>
      {/* LIVE PREVIEW */}
      <div className={styles.previewSection}>
        <div className={styles.sectionTitle}>
          <span>👁️</span>
          <span>Vista Previa en Vivo</span>
        </div>
        <div className={styles.sectionSubtitle}>
          Así se verá la barra en la parte superior del sitio (debajo del menú). Al pasar el cursor, el texto se pausa y el enlace se resalta.
        </div>
        <div className={styles.previewBox}>
          {!config.enabled ? (
            <div className={styles.previewDisabledNotice}>
              ⚠️ La Barra de Noticias está desactivada actualmente. Actívala abajo para que aparezca en el sitio.
            </div>
          ) : !config.items || config.items.filter((i) => i.enabled !== false && i.text && i.text.trim()).length === 0 ? (
            <div className={styles.previewDisabledNotice}>
              ℹ️ La barra está oculta porque no hay noticias agregadas o con texto en la base de datos. Agrega una noticia abajo para verla.
            </div>
          ) : (
            <NewsBar initialConfig={config} />
          )}
        </div>
      </div>

      {/* GLOBAL SETTINGS */}
      <div className={styles.settingsCard}>
        <div className={styles.sectionTitle}>
          <span>⚙️</span>
          <span>Ajustes Generales de la Barra</span>
        </div>
        
        <div className={styles.settingsGrid}>
          {/* Enable / Disable */}
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Estado de la Barra</span>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                className={styles.switchInput}
                checked={config.enabled}
                onChange={(e) => handleGlobalChange('enabled', e.target.checked)}
              />
              <span>{config.enabled ? '🟢 Visible en la Web' : '⚪ Oculta en la Web'}</span>
            </label>
            <span className={styles.fieldHint}>Muestra u oculta la barra en todo el sitio web</span>
          </div>

          {/* Badge Label */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Texto del Distintivo (Badge)</label>
            <input
              type="text"
              className={styles.input}
              value={config.badgeText || ''}
              onChange={(e) => handleGlobalChange('badgeText', e.target.value)}
              placeholder="Ej: NOTICIAS, AVISOS, FLASH (dejar vacío para ocultar)"
            />
            <span className={styles.fieldHint}>Etiqueta fija a la izquierda con indicador parpadeante</span>
          </div>

          {/* Speed */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Velocidad de Deslizamiento</label>
            <select
              className={styles.select}
              value={config.speed || 'normal'}
              onChange={(e) => handleGlobalChange('speed', e.target.value)}
            >
              <option value="slow">Lenta (Más tiempo para leer)</option>
              <option value="normal">Normal (Recomendada)</option>
              <option value="fast">Rápida</option>
            </select>
            <span className={styles.fieldHint}>Controla qué tan rápido se mueve el texto de derecha a izquierda</span>
          </div>

          {/* Separator */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Símbolo de Separación</label>
            <select
              className={styles.select}
              value={config.separator || '✦'}
              onChange={(e) => handleGlobalChange('separator', e.target.value)}
            >
              {separatorPresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
            <span className={styles.fieldHint}>Ícono o caracter que separa cada noticia en el carrusel</span>
          </div>

          {/* Spacing / Separation Width */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Distancia / Separación</label>
            <select
              className={styles.select}
              value={config.spacing || 'double'}
              onChange={(e) => handleGlobalChange('spacing', e.target.value)}
            >
              <option value="normal">Normal (24px)</option>
              <option value="double">Doble (48px - Recomendada)</option>
              <option value="wide">Extra Amplia (72px)</option>
            </select>
            <span className={styles.fieldHint}>Espacio libre alrededor del separador entre cada ciclo o noticia</span>
          </div>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className={styles.itemsSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className={styles.sectionTitle}>
              <span>📰</span>
              <span>Elementos de Noticias ({config.items.length})</span>
            </div>
            <div className={styles.sectionSubtitle} style={{ marginBottom: 0 }}>
              Cada elemento cuenta con un área de texto y su enlace correspondiente para que los usuarios puedan hacer clic.
            </div>
          </div>
          <button className={styles.addItemBtn} onClick={handleAddItem}>
            <span>+</span>
            <span>Agregar Noticia</span>
          </button>
        </div>

        {config.items.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ margin: 0 }}>No hay elementos en la barra de noticias. Haz clic en "Agregar Noticia" para crear el primero.</p>
          </div>
        )}

        {config.items.map((item, index) => (
          <div
            key={item.id || index}
            className={`${styles.itemCard} ${!item.enabled ? styles.disabledItem : ''}`}
          >
            {/* ITEM HEADER */}
            <div className={styles.itemHeader}>
              <div className={styles.itemHeaderLeft}>
                <span className={styles.itemBadge}>#{index + 1}</span>
                <span className={styles.clicksBadge} title="Total de clics recibidos en esta noticia">
                  👆 {item.clicks || 0} clics
                </span>
                <span className={styles.itemTitlePreview}>
                  {item.text ? renderFormattedNewsText(item.text) : '(Sin texto todavía)'}
                </span>
              </div>
              <div className={styles.itemActions}>
                {/* Move Up */}
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => handleMoveItem(index, -1)}
                  disabled={index === 0}
                  title="Subir posición"
                >
                  ▲ Subir
                </button>
                {/* Move Down */}
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => handleMoveItem(index, 1)}
                  disabled={index === config.items.length - 1}
                  title="Bajar posición"
                >
                  ▼ Bajar
                </button>
                {/* Delete */}
                <button
                  type="button"
                  className={`${styles.btnAction} ${styles.btnActionDelete}`}
                  onClick={() => handleRemoveItem(index)}
                  title="Eliminar noticia"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>

            {/* ITEM BODY */}
            <div className={styles.itemBody}>
              {/* Textarea */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Texto de la Noticia / Anuncio <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id={`news-textarea-${index}`}
                  className={styles.textarea}
                  rows={2}
                  value={item.text || ''}
                  onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                  placeholder="Escribe el texto que se desplazará en la marquesina..."
                />
                {/* COLOR HIGHLIGHT TOOLBAR */}
                <div className={styles.formatterToolbar}>
                  <span className={styles.formatterHint}>🎨 Resaltar:</span>
                  <button
                    type="button"
                    className={`${styles.tagBtn} ${styles.tagBtnGold}`}
                    onClick={() => handleWrapText(index, '**', '**')}
                    title="Resaltar selección con doble asterisco (**texto**)"
                  >
                    ✨ **Dorado**
                  </button>
                  <button
                    type="button"
                    className={`${styles.tagBtn} ${styles.tagBtnGold}`}
                    onClick={() => handleWrapText(index, '[dorado]', '[/dorado]')}
                    title="Pintar en dorado"
                  >
                    🟡 [dorado]
                  </button>
                  <button
                    type="button"
                    className={`${styles.tagBtn} ${styles.tagBtnRed}`}
                    onClick={() => handleWrapText(index, '[rojo]', '[/rojo]')}
                    title="Texto en rojo vibrante (ideal para EN VIVO o ALERTAS)"
                  >
                    🔴 [rojo]
                  </button>
                  <button
                    type="button"
                    className={`${styles.tagBtn} ${styles.tagBtnGreen}`}
                    onClick={() => handleWrapText(index, '[verde]', '[/verde]')}
                    title="Texto en verde esmeralda"
                  >
                    🟢 [verde]
                  </button>
                  <button
                    type="button"
                    className={`${styles.tagBtn} ${styles.tagBtnBlue}`}
                    onClick={() => handleWrapText(index, '[azul]', '[/azul]')}
                    title="Texto en azul / cyan"
                  >
                    🔵 [azul]
                  </button>
                  <button
                    type="button"
                    className={`${styles.tagBtn} ${styles.tagBtnPurple}`}
                    onClick={() => handleWrapText(index, '[violeta]', '[/violeta]')}
                    title="Texto en violeta"
                  >
                    🟣 [violeta]
                  </button>
                  <button
                    type="button"
                    className={`${styles.tagBtn} ${styles.tagBtnOrange}`}
                    onClick={() => handleWrapText(index, '[naranja]', '[/naranja]')}
                    title="Texto en naranja"
                  >
                    🟠 [naranja]
                  </button>
                </div>
              </div>

              {/* URL input */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  URL o Enlace de Destino (al hacer clic en todo el texto)
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={item.url || ''}
                  onChange={(e) => handleItemChange(index, 'url', e.target.value)}
                  placeholder="Ej: /eventos/road-to-vgs o https://..."
                />
                <span className={styles.fieldHint}>
                  Puedes colocar rutas internas como <code>/eventos</code>, <code>/guias</code>, o enlaces externos como <code>https://...</code>
                </span>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '4px' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={item.openInNewTab || false}
                    onChange={(e) => handleItemChange(index, 'openInNewTab', e.target.checked)}
                  />
                  <span>Abrir enlace en pestaña nueva (target="_blank")</span>
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) => handleItemChange(index, 'enabled', e.target.checked)}
                  />
                  <span>Mostrar este elemento en la marquesina</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NOTICE BOX */}
      <div className={styles.noticeBox}>
        💡 <strong>Consejo:</strong> Después de presionar <strong>"Guardar Noticias"</strong>, los cambios se reflejan inmediatamente en la sesión. Para compilarlos y publicarlos definitivamente en el sitio web en vivo (GitHub Pages), utiliza el botón <strong>"Publicar Cambios"</strong> en la esquina superior del panel.
      </div>

      {/* STICKY BOTTOM SAVE BAR */}
      <div className={styles.saveBar}>
        <div>
          {statusMessage.text ? (
            <span className={`${styles.saveStatus} ${styles[statusMessage.type]}`}>
              {statusMessage.text}
            </span>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              {config.items.filter((i) => i.enabled !== false && i.text?.trim()).length} de{' '}
              {config.items.length} noticias activas
            </span>
          )}
        </div>
        <button
          className={styles.addItemBtn}
          style={{
            background: isSaving ? '#64748b' : '#10b981',
            color: '#fff',
            border: 'none',
            padding: '10px 24px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
          }}
          onClick={handleSave}
          disabled={isSaving}
        >
          <span>💾</span>
          <span>{isSaving ? 'Guardando...' : 'Guardar Noticias'}</span>
        </button>
      </div>
    </div>
  );
}
