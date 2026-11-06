import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { parseYouTubeVideo } from '@stores/blogStore';
import styles from './css/BlogManager.module.css';

/**
 * ============================================================================
 * COMPONENTE BLOG MANAGER - PANEL DE ADMINISTRACIÓN INDUS3
 * ============================================================================
 * Permite crear, editar, listar y eliminar artículos de noticias y blog.
 * Soporta dos modalidades:
 * 1. Artículo Tradicional: Redacción HTML completa con autor y página individual.
 * 2. Video / Short (Modal en Card): Card 16:9 que abre YouTube en modal sin página.
 * Conectado con la base de datos MySQL en api.indus3pro.com.
 */
const BlogManager = () => {
  const [activeTab, setActiveTab] = useState('crear'); // 'crear' | 'lista'
  const [postType, setPostType] = useState('article'); // 'article' | 'video'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'code' | 'preview'

  // Lista de autores y tags cargados desde la base de datos o valores por defecto
  const [autores, setAutores] = useState([
    {
      id: 1,
      nombre: 'Equipo Indus3',
      rol: 'Redacción & Producción',
      avatar: '/indus3-logo.webp',
      bio: 'Equipo editorial y de producción de Indus3 Pro.'
    }
  ]);

  const [availableTags, setAvailableTags] = useState([
    { id: 1, slug: 'eventos', nombre: 'Eventos' },
    { id: 2, slug: 'noticias', nombre: 'Noticias' },
    { id: 3, slug: 'musica', nombre: 'Música' },
    { id: 4, slug: 'produccion', nombre: 'Producción' },
    { id: 5, slug: 'conciertos', nombre: 'Conciertos' }
  ]);

  // Publicaciones existentes para la vista de listado
  const [existingPosts, setExistingPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Estado del formulario del post
  const [postId, setPostId] = useState(0);
  const [title, setTitle] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [autorId, setAutorId] = useState(1);
  const [selectedTagIds, setSelectedTagIds] = useState([1, 2]);
  const [image, setImage] = useState('/indus3-logo.webp');
  const [video, setVideo] = useState('');
  const [featured, setFeatured] = useState(false);
  const [readTime, setReadTime] = useState('4 min de lectura');
  const [status, setStatus] = useState('published');
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [updatedAt, setUpdatedAt] = useState('');

  // Estado de validación de unicidad del slug
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: null, message: '' });
  const [saveStatus, setSaveStatus] = useState({ saving: false, message: '', error: false });

  // Inputs para agregar una nueva etiqueta rápida
  const [newTagNameInput, setNewTagNameInput] = useState('');
  const [newTagSlugInput, setNewTagSlugInput] = useState('');

  // Estados de Galería de Imágenes con soporte de Carpetas y Búsqueda
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryFolders, setGalleryFolders] = useState(['general']);
  const [selectedGalleryFolder, setSelectedGalleryFolder] = useState('todas');
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [uploadFolder, setUploadFolder] = useState('general');
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef(null);

  // Estados para Gestor de Etiquetas (Crear / Editar / Eliminar con cascada)
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTagItem, setEditingTagItem] = useState(null); // null o { id, nombre, slug }
  const [savingTag, setSavingTag] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState(0);

  // Estados para Gestor de Autores (Crear / Editar / Subir Avatar)
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [authorEditingId, setAuthorEditingId] = useState(0);
  const [authorNombre, setAuthorNombre] = useState('');
  const [authorRol, setAuthorRol] = useState('Equipo Editorial Indus3');
  const [authorAvatar, setAuthorAvatar] = useState('/indus3-logo.webp');
  const [authorBio, setAuthorBio] = useState('');
  const [savingAuthor, setSavingAuthor] = useState(false);
  const [uploadingAuthorAvatar, setUploadingAuthorAvatar] = useState(false);
  const authorFileInputRef = useRef(null);

  // Destino de la imagen de galería ('post' para portada, 'author' para avatar, 'editor' para imagen del contenido)
  const [galleryTarget, setGalleryTarget] = useState('post');

  // Estados para modal de Inserción de Imagen en el Editor HTML
  const [editorImageModalOpen, setEditorImageModalOpen] = useState(false);
  const [editorImageSource, setEditorImageSource] = useState('url'); // 'url' | 'upload'
  const [editorImageUrl, setEditorImageUrl] = useState('');
  const [editorImageAlt, setEditorImageAlt] = useState('');
  const [editorImageUploading, setEditorImageUploading] = useState(false);
  const editorFileInputRef = useRef(null);

  const textareaRef = useRef(null);

  // Helper para contar palabras del artículo (excluyendo etiquetas HTML)
  const calculateWordCount = (html) => {
    if (!html) return 0;
    const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleanText ? cleanText.split(/\s+/).length : 0;
  };

  // Helper para headers con token Bearer (prioriza token de sesión de admin)
  const getAuthHeaders = (isJson = true) => {
    const headers = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    const token =
      (typeof window !== 'undefined' && sessionStorage.getItem('indus3_admin_token')) ||
      import.meta.env.PUBLIC_BACKEND_AUTH_KEY ||
      '';
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Cargar autores, tags y posts al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const isSession =
          sessionStorage.getItem('indus3_admin_session') === 'true' ||
          localStorage.getItem('indus3_admin_session') === 'true' ||
          document.cookie.indexOf('indus3_admin_session=true') !== -1;
        if (isSession) {
          sessionStorage.setItem('indus3_admin_session', 'true');
          localStorage.setItem('indus3_admin_session', 'true');
          document.cookie = "indus3_admin_session=true; path=/; max-age=86400; SameSite=Lax";
          const tok = sessionStorage.getItem('indus3_admin_token') || localStorage.getItem('indus3_admin_token');
          if (tok) {
            sessionStorage.setItem('indus3_admin_token', tok);
            localStorage.setItem('indus3_admin_token', tok);
          }
        }
      } catch (e) {}
    }
    fetchAutores();
    fetchTags();
    fetchExistingPosts();
  }, []);

  // Consultar lista de autores desde la base de datos
  const fetchAutores = async () => {
    try {
      const res = await fetch('https://api.indus3pro.com/blog/autores.php', {
        headers: getAuthHeaders(false)
      });
      const data = await res.json();
      if (data.success && data.autores && data.autores.length > 0) {
        setAutores(data.autores);
        if (!autorId && data.autores[0]) {
          setAutorId(data.autores[0].id);
        }
      }
    } catch (e) {
      console.log('Usando autores por defecto');
    }
  };

  // Consultar lista de tags desde la base de datos
  const fetchTags = async () => {
    try {
      const res = await fetch('https://api.indus3pro.com/blog/tags.php', {
        headers: getAuthHeaders(false)
      });
      const data = await res.json();
      if (data.success && data.tags && data.tags.length > 0) {
        setAvailableTags(data.tags);
      }
    } catch (e) {
      console.log('Usando tags por defecto');
    }
  };

  // Consultar todas las publicaciones existentes
  const fetchExistingPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch('https://api.indus3pro.com/blog/get_posts.php?t=' + Date.now(), {
        headers: getAuthHeaders(false)
      });
      const data = await res.json();
      if (data.success && data.posts) {
        setExistingPosts(data.posts);
      }
    } catch (e) {
      console.log('Error al consultar publicaciones existentes');
    } finally {
      setLoadingPosts(false);
    }
  };

  // Helper para formatear texto a slug
  const formatSlugText = (text) => {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[áàäâã]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöôõ]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Limpiar y formatear slug escrito a mano (reemplazando acentos latinos antes de la limpieza)
  const handleCleanManualSlug = () => {
    if (!slug.trim()) return;
    const cleaned = formatSlugText(slug);
    setSlug(cleaned);
    checkSlugAvailability(cleaned, postId);
  };

  // Comprobar disponibilidad de slug contra la API (excluyendo el ID actual si editamos)
  const checkSlugAvailability = async (slugToCheck, excludeIdOverride) => {
    const slugFinal = (slugToCheck || slug).trim();
    const currentExcludeId = excludeIdOverride !== undefined ? excludeIdOverride : postId;
    if (!slugFinal) {
      setSlugStatus({ checking: false, available: null, message: '' });
      return;
    }

    setSlugStatus({ checking: true, available: null, message: 'Comprobando slug...' });
    try {
      const res = await fetch(
        `https://api.indus3pro.com/blog/check_slug.php?slug=${encodeURIComponent(slugFinal)}&exclude_id=${currentExcludeId}`,
        { headers: getAuthHeaders(false) }
      );
      const data = await res.json();
      if (data.success) {
        setSlugStatus({
          checking: false,
          available: data.available,
          message: data.message
        });
      } else {
        setSlugStatus({
          checking: false,
          available: false,
          message: data.message || 'Slug inválido'
        });
      }
    } catch (err) {
      setSlugStatus({
        checking: false,
        available: true,
        message: 'Modo sin conexión: slug asumido disponible'
      });
    }
  };

  // Insertar etiquetas HTML en la posición del cursor sin saltar el scroll de la ventana
  const insertSnippet = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const scrollY = window.scrollY;
    const textareaScrollTop = textarea.scrollTop;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      (selectedText || '') +
      after +
      content.substring(end);

    setContent(newText);

    setTimeout(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
      textarea.scrollTop = textareaScrollTop;
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    }, 0);
  };

  // Alternar selección de tags
  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Cargar galería de imágenes y carpetas disponibles
  const fetchGallery = async () => {
    setLoadingGallery(true);
    try {
      const res = await fetch('https://api.indus3pro.com/blog/galeria.php?t=' + Date.now(), {
        headers: getAuthHeaders(false)
      });
      const data = await res.json();
      if (data.success && data.imagenes) {
        setGalleryImages(data.imagenes);
        if (data.folders && Array.isArray(data.folders)) {
          setGalleryFolders(data.folders);
        }
      }
    } catch (e) {
      console.log('Error al cargar galería');
    } finally {
      setLoadingGallery(false);
    }
  };

  // Crear una nueva carpeta dentro de la galería
  const handleCreateFolder = async (e) => {
    if (e) e.preventDefault();
    if (!newFolderNameInput.trim()) {
      alert('Por favor ingresa un nombre para la carpeta.');
      return;
    }

    setCreatingFolder(true);
    try {
      const res = await fetch('https://api.indus3pro.com/blog/galeria.php', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          action: 'create_folder',
          folder_name: newFolderNameInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || '¡Carpeta creada con éxito!');
        const createdFolder = data.folder || newFolderNameInput.trim().toLowerCase();
        setNewFolderNameInput('');
        await fetchGallery();
        setSelectedGalleryFolder(createdFolder);
        setUploadFolder(createdFolder);
      } else {
        alert(data.message || 'Error al crear la carpeta');
      }
    } catch (err) {
      alert('Error de conexión al crear la carpeta');
    } finally {
      setCreatingFolder(false);
    }
  };

  // Eliminar imagen de la galería
  const handleDeleteGalleryImage = async (e, img) => {
    e.stopPropagation();
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente la imagen "${img.filename}" del servidor?`)) {
      return;
    }

    try {
      const res = await fetch('https://api.indus3pro.com/blog/galeria.php', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          action: 'delete_image',
          filename: img.filename,
          folder: img.folder
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchGallery();
      } else {
        alert(data.message || 'Error al eliminar la imagen');
      }
    } catch (err) {
      alert('Error de conexión al eliminar la imagen');
    }
  };

  // Subir imagen a la galería evitando sobreescritura y con carpeta destino
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    const formData = new FormData();
    formData.append('imagen', file);
    if (uploadFolder && uploadFolder !== 'todas') {
      formData.append('folder', uploadFolder);
    }

    try {
      const res = await fetch('https://api.indus3pro.com/blog/subir_imagen.php', {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (galleryTarget === 'author') {
          setAuthorAvatar(data.url);
          alert('¡Foto de autor subida exitosamente!');
        } else if (galleryTarget === 'editor') {
          setEditorImageUrl(data.url);
          if (!editorImageAlt.trim()) {
            const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            setEditorImageAlt(rawName.charAt(0).toUpperCase() + rawName.slice(1));
          }
          setEditorImageModalOpen(true);
          setGalleryOpen(false);
          alert('¡Imagen subida exitosamente! Lista para insertar en el contenido.');
        } else {
          setImage(data.url);
          alert('¡Imagen de portada subida exitosamente!');
        }
        fetchGallery();
      } else {
        alert(data.message || 'Error al subir la imagen');
      }
    } catch (err) {
      alert('Error de conexión al subir la imagen');
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Subir imagen para insertar directamente dentro del editor HTML
  const handleEditorImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditorImageUploading(true);
    const formData = new FormData();
    formData.append('imagen', file);
    if (uploadFolder && uploadFolder !== 'todas') {
      formData.append('folder', uploadFolder);
    }

    try {
      const res = await fetch('https://api.indus3pro.com/blog/subir_imagen.php', {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setEditorImageUrl(data.url);
        if (!editorImageAlt.trim()) {
          const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setEditorImageAlt(rawName.charAt(0).toUpperCase() + rawName.slice(1));
        }
        fetchGallery();
      } else {
        alert(data.message || 'Error al subir la imagen');
      }
    } catch (err) {
      alert('Error de conexión al subir la imagen');
    } finally {
      setEditorImageUploading(false);
      if (editorFileInputRef.current) editorFileInputRef.current.value = '';
    }
  };

  // Insertar la etiqueta HTML de la imagen en la posición del cursor del editor
  const handleInsertEditorImage = (e) => {
    if (e) e.preventDefault();
    if (!editorImageUrl.trim()) {
      alert('Por favor ingresa una URL válida o sube una imagen primero.');
      return;
    }

    const altText = editorImageAlt.trim() || 'Imagen de la publicación';
    const snippet = `\n<img src="${editorImageUrl.trim()}" alt="${altText}" style="width:100%; border-radius:12px; margin:1.5rem 0;" />\n`;
    insertSnippet(snippet);
    setEditorImageModalOpen(false);
    setEditorImageUrl('');
    setEditorImageAlt('');
  };

  // Modal para crear nuevo autor
  const handleOpenNewAuthor = () => {
    setAuthorEditingId(0);
    setAuthorNombre('');
    setAuthorRol('Equipo Editorial Indus3');
    setAuthorAvatar('/indus3-logo.webp');
    setAuthorBio('');
    setAuthorModalOpen(true);
  };

  // Modal para editar autor específico
  const handleEditAuthor = (author) => {
    if (!author) return;
    setAuthorEditingId(author.id);
    setAuthorNombre(author.nombre);
    setAuthorRol(author.rol || 'Equipo Editorial Indus3');
    setAuthorAvatar(author.avatar || '/indus3-logo.webp');
    setAuthorBio(author.bio || '');
    setAuthorModalOpen(true);
  };

  // Editar el autor seleccionado en el dropdown
  const handleEditCurrentAuthor = () => {
    const current = autores.find((a) => a.id === autorId) || autores[0];
    if (current) handleEditAuthor(current);
  };

  // Guardar autor (crear o editar)
  const handleSaveAuthor = async (e) => {
    if (e) e.preventDefault();
    if (!authorNombre.trim()) {
      alert('Por favor ingresa el nombre del autor.');
      return;
    }

    setSavingAuthor(true);
    try {
      const res = await fetch('https://api.indus3pro.com/blog/autores.php', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          id: authorEditingId,
          nombre: authorNombre.trim(),
          rol: authorRol.trim(),
          avatar: authorAvatar.trim() || '/indus3-logo.webp',
          bio: authorBio.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.autor) {
        alert(data.message || (authorEditingId ? '¡Autor actualizado con éxito!' : '¡Autor creado con éxito!'));
        await fetchAutores();
        setAutorId(data.autor.id);
        setAuthorModalOpen(false);
      } else {
        alert(data.message || 'Error al guardar autor.');
      }
    } catch (err) {
      alert('Error de conexión al guardar el autor.');
    } finally {
      setSavingAuthor(false);
    }
  };

  // Subir avatar para autor
  const handleAuthorAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAuthorAvatar(true);
    const formData = new FormData();
    formData.append('imagen', file);

    try {
      const res = await fetch('https://api.indus3pro.com/blog/subir_imagen.php', {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setAuthorAvatar(data.url);
        alert('¡Foto de autor subida exitosamente!');
        fetchGallery();
      } else {
        alert(data.message || 'Error al subir la foto');
      }
    } catch (err) {
      alert('Error de conexión al subir la imagen');
    } finally {
      setUploadingAuthorAvatar(false);
      if (authorFileInputRef.current) authorFileInputRef.current.value = '';
    }
  };

  // Crear nuevo tag con nombre y slug opcional
  const handleAddNewTag = async () => {
    if (!newTagNameInput.trim()) return;
    try {
      const res = await fetch('https://api.indus3pro.com/blog/tags.php', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          nombre: newTagNameInput.trim(),
          slug: newTagSlugInput.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.tag) {
        setAvailableTags((prev) => [...prev, data.tag]);
        setSelectedTagIds((prev) => [...prev, data.tag.id]);
        setNewTagNameInput('');
        setNewTagSlugInput('');
        fetchTags();
      }
    } catch (e) {
      const fakeId = Date.now();
      const fallbackSlug = (newTagSlugInput.trim() || newTagNameInput.trim().toLowerCase().replace(/\s+/g, '-'));
      const fakeTag = { id: fakeId, slug: fallbackSlug, nombre: newTagNameInput.trim() };
      setAvailableTags((prev) => [...prev, fakeTag]);
      setSelectedTagIds((prev) => [...prev, fakeId]);
      setNewTagNameInput('');
      setNewTagSlugInput('');
    }
  };

  // Guardar edición de una etiqueta (actualiza su nombre/slug y se refleja en todos los artículos asociados)
  const handleSaveTagEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingTagItem || !editingTagItem.nombre.trim()) {
      alert('Por favor ingresa un nombre para la etiqueta.');
      return;
    }

    setSavingTag(true);
    try {
      const res = await fetch('https://api.indus3pro.com/blog/tags.php', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          action: 'update',
          id: editingTagItem.id,
          nombre: editingTagItem.nombre.trim(),
          slug: editingTagItem.slug ? editingTagItem.slug.trim() : ''
        })
      });
      const data = await res.json();
      if (data.success && data.tag) {
        setAvailableTags((prev) =>
          prev.map((t) => (t.id === data.tag.id ? { ...t, ...data.tag } : t))
        );
        // Actualizar en memoria las publicaciones existentes para que reflejen el nuevo nombre y slug
        setExistingPosts((prev) =>
          prev.map((post) => ({
            ...post,
            tags: (post.tags || []).map((t) =>
              (typeof t === 'object' && t.id === data.tag.id) ? { ...t, ...data.tag } : t
            )
          }))
        );
        alert(data.message || '¡Etiqueta actualizada exitosamente en todos los artículos!');
        setEditingTagItem(null);
        await fetchTags();
        fetchExistingPosts();
      } else {
        alert(data.message || 'Error al actualizar la etiqueta');
      }
    } catch (err) {
      alert('Error de conexión al actualizar la etiqueta');
    } finally {
      setSavingTag(false);
    }
  };

  // Eliminar permanentemente una etiqueta y limpiarla en cascada de todos los posts
  const handleDeleteTag = async (tagId, tagName) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar permanentemente la etiqueta "${tagName}"?\n\n⚠️ Esta acción la desvinculará automáticamente de todos los artículos que la tengan.`
      )
    ) {
      return;
    }

    setDeletingTagId(tagId);
    try {
      const res = await fetch('https://api.indus3pro.com/blog/tags.php', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          action: 'delete',
          id: tagId
        })
      });
      const data = await res.json();
      if (data.success) {
        // Remover de etiquetas disponibles
        setAvailableTags((prev) => prev.filter((t) => t.id !== tagId));
        // Remover de etiquetas seleccionadas en el formulario actual si estaba elegida
        setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
        // Limpiar en memoria de todos los posts existentes
        setExistingPosts((prev) =>
          prev.map((post) => ({
            ...post,
            tags: (post.tags || []).filter((t) =>
              typeof t === 'object' ? t.id !== tagId : t !== tagName
            )
          }))
        );
        if (editingTagItem?.id === tagId) {
          setEditingTagItem(null);
        }
        alert(data.message || '¡Etiqueta eliminada y desvinculada de todos los artículos con éxito!');
        await fetchTags();
        fetchExistingPosts();
      } else {
        alert(data.message || 'Error al eliminar la etiqueta');
      }
    } catch (err) {
      alert('Error de conexión al eliminar la etiqueta');
    } finally {
      setDeletingTagId(0);
    }
  };

  // Guardar o Actualizar Post
  const handleSavePost = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert(postType === 'video' ? 'Por favor ingresa un título para el video.' : 'Por favor ingresa un título para la noticia.');
      return;
    }

    if (postType === 'video' && !video.trim()) {
      alert('Por favor ingresa la URL de YouTube para el video o short.');
      return;
    }

    let finalSlug = slug.trim();
    if (!finalSlug) {
      finalSlug = (postType === 'video' ? 'video-' : '') + formatSlugText(title);
      setSlug(finalSlug);
    }

    if (slugStatus.available === false) {
      alert('El slug ya está en uso. Por favor cámbialo o corrígelo antes de guardar.');
      return;
    }

    setSaveStatus({ saving: true, message: 'Guardando publicación...', error: false });

    // Determinar imagen final (personalizada o miniatura automática de YouTube)
    let finalImage = image.trim();
    if (postType === 'video') {
      const yt = parseYouTubeVideo(video);
      if (!finalImage || finalImage === '/indus3-logo.webp') {
        finalImage = yt.thumbnailMaxRes || yt.thumbnailHq || '/indus3-logo.webp';
      }
    }

    const payload = {
      id: postId,
      title: title.trim(),
      seo_title: seoTitle.trim() || title.trim(),
      keywords: keywords.trim(),
      slug: finalSlug,
      excerpt: excerpt.trim(),
      content: postType === 'video' ? '' : content.trim(),
      autor_id: autorId,
      image: finalImage,
      video: video.trim(),
      featured: featured,
      read_time: postType === 'video' ? 'Video' : readTime.trim(),
      status: status,
      created_at: createdAt || null,
      tag_ids: selectedTagIds
    };

    try {
      const res = await fetch('https://api.indus3pro.com/blog/guardar_post.php', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setSaveStatus({
          saving: false,
          message: data.message || '¡Publicación guardada exitosamente!',
          error: false
        });
        setPostId(data.post_id || postId);
        fetchExistingPosts();
      } else {
        setSaveStatus({
          saving: false,
          message: data.message || 'Error al guardar.',
          error: true
        });
      }
    } catch (err) {
      setSaveStatus({
        saving: false,
        message: 'Error de conexión con la API de Indus3.',
        error: true
      });
    }
  };

  // Eliminar publicación
  const handleDeletePost = async (id, postTitle) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el artículo "${postTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch('https://api.indus3pro.com/blog/eliminar_post.php', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        alert('Artículo eliminado correctamente.');
        if (postId === id) {
          handleResetForm();
        }
        fetchExistingPosts();
      } else {
        alert(data.message || 'Error al eliminar el artículo.');
      }
    } catch (e) {
      alert('Error de conexión al intentar eliminar el artículo.');
    }
  };

  // Limpiar formulario para nuevo post
  const handleResetForm = () => {
    setPostType('article');
    setPostId(0);
    setTitle('');
    setSeoTitle('');
    setKeywords('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setImage('/indus3-logo.webp');
    setVideo('');
    setFeatured(false);
    setReadTime('4 min de lectura');
    setStatus('published');
    setCreatedAt(new Date().toISOString().split('T')[0]);
    setUpdatedAt('');
    setSelectedTagIds([]);
    setGalleryTarget('post');
    setEditorImageUrl('');
    setEditorImageAlt('');
    setSlugStatus({ checking: false, available: null, message: '' });
    setSaveStatus({ saving: false, message: '', error: false });
  };

  // Cargar post para editar
  const handleEditPost = (post) => {
    const isVideo =
      String(post.read_time || '').toLowerCase() === 'video' ||
      String(post.readTime || '').toLowerCase() === 'video' ||
      (Boolean(post.video) && (!post.content || post.content.trim() === '' || post.content.trim() === '<p>Video de YouTube</p>'));

    setPostType(isVideo ? 'video' : 'article');
    setPostId(post.id);
    setTitle(post.title || '');
    setSeoTitle(post.seo_title || post.seoTitle || '');
    setKeywords(post.keywords || '');
    setSlug(post.slug || '');
    setExcerpt(post.excerpt || '');
    setContent(post.content || '');
    setAutorId(post.autor_id || 1);
    setImage(post.image || '/indus3-logo.webp');
    setVideo(post.video || '');
    setFeatured(Boolean(post.featured));
    setReadTime(isVideo ? 'Video' : (post.read_time || '4 min de lectura'));
    setStatus(post.status || 'published');
    setCreatedAt(post.created_at ? post.created_at.split(' ')[0] : (post.date || new Date().toISOString().split('T')[0]));
    setUpdatedAt(post.updated_at || '');
    if (post.tags && Array.isArray(post.tags)) {
      setSelectedTagIds(post.tags.map((t) => t.id));
    }
    setGalleryTarget('post');
    setEditorImageUrl('');
    setEditorImageAlt('');
    setActiveTab('crear');
    checkSlugAvailability(post.slug, post.id);
  };

  return (
    <div className={styles.adminBlogContainer}>
      {/* Pestañas superiores */}
      <div className={styles.headerTabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'crear' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('crear')}
        >
          {postId > 0 ? `✏️ Editando Noticia #${postId}` : '➕ Crear Nueva Noticia'}
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'lista' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('lista');
            fetchExistingPosts();
          }}
        >
          📋 Gestionar Noticias ({existingPosts.length})
        </button>
        {postId > 0 && (
          <button
            type="button"
            className={styles.btnSmall}
            onClick={handleResetForm}
            style={{ marginLeft: 'auto' }}
          >
            + Nuevo Artículo
          </button>
        )}
      </div>

      {activeTab === 'crear' ? (
        <form onSubmit={handleSavePost} className={styles.formCard}>
          {/* Selector de Tipo de Publicación */}
          <div className={styles.postTypeContainer}>
            <div className={styles.postTypeTabs}>
              <button
                type="button"
                className={`${styles.postTypeTab} ${postType === 'article' ? styles.postTypeTabActive : ''}`}
                onClick={() => {
                  setPostType('article');
                  if (readTime === 'Video') setReadTime('4 min de lectura');
                }}
              >
                <span className={styles.postTypeEmoji}>📰</span>
                <div>
                  <span className={styles.postTypeLabel}>Artículo Tradicional</span>
                  <span className={styles.postTypeSub}>Redacción completa con HTML, autor y página propia</span>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.postTypeTab} ${postType === 'video' ? styles.postTypeTabActive : ''}`}
                onClick={() => {
                  setPostType('video');
                  setReadTime('Video');
                  if (postId === 0 && !slug.startsWith('video-') && slug) {
                    setSlug(`video-${slug}`);
                  }
                }}
              >
                <span className={styles.postTypeEmoji}>🎬</span>
                <div>
                  <span className={styles.postTypeLabel}>Video / Short (Modal en Card)</span>
                  <span className={styles.postTypeSub}>Card 16:9 que abre YouTube en modal sin página individual</span>
                </div>
              </button>
            </div>
          </div>

          {postType === 'video' ? (
            /* ===============================================================
               MODALIDAD VIDEO / SHORT: FORMULARIO DIRECTO Y OPTIMIZADO
               =============================================================== */
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                🎬 Configuración de Video / Short (Modal en la misma página)
              </legend>
              <div className={styles.fieldsetGrid}>
                {/* Título del Video */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    <span>Título del Video (Se mostrará en la Card y en el reproductor):</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Requerido</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Ej: Danny Ocean en vivo en el Estadio Olímpico de Caracas..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (postId === 0) {
                        const auto = 'video-' + formatSlugText(e.target.value);
                        setSlug(auto);
                      }
                    }}
                    required
                  />
                </div>

                {/* URL de YouTube */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    <span>URL de YouTube (Video Estándar o Short):</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Requerido</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="https://www.youtube.com/watch?v=... o https://youtube.com/shorts/..."
                    value={video}
                    onChange={(e) => {
                      const url = e.target.value;
                      setVideo(url);
                      const yt = parseYouTubeVideo(url);
                      if (yt.youtubeId && (!image || image === '/indus3-logo.webp')) {
                        setImage(yt.thumbnailMaxRes || yt.thumbnailHq || '/indus3-logo.webp');
                      }
                    }}
                    required
                  />
                  {/* Badge de detección inteligente de YouTube */}
                  {(() => {
                    const yt = parseYouTubeVideo(video);
                    if (!video.trim()) return null;
                    if (!yt.youtubeId) {
                      return (
                        <span style={{ fontSize: '0.82rem', color: '#f87171', marginTop: '0.35rem' }}>
                          ⚠️ No se detectó un enlace válido de YouTube. Ingresa un enlace como youtube.com/watch?v=... o youtube.com/shorts/...
                        </span>
                      );
                    }
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '6px',
                          background: yt.isShort ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                          color: yt.isShort ? '#facc15' : '#60a5fa',
                          fontWeight: 700,
                          border: `1px solid ${yt.isShort ? 'rgba(234, 179, 8, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                        }}>
                          {yt.isShort ? '⚡ DETECTADO: YouTube Short (Modal 9:16 vertical)' : '▶ DETECTADO: Video Estándar (Modal 16:9 horizontal)'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          ID: <code>{yt.youtubeId}</code>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Imagen Horizontal Personalizada para la Card (16:9) */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    <span>Imagen horizontal personalizada (16:9) para la Card (Opcional):</span>
                  </label>
                  <div className={styles.imageActionsRow}>
                    {image && image !== '/indus3-logo.webp' && (
                      <img
                        src={image}
                        alt="Preview"
                        className={styles.imagePreviewThumb}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Deja vacío para usar automáticamente el thumbnail de YouTube"
                      value={(() => {
                        const yt = parseYouTubeVideo(video);
                        if (image === yt.thumbnailMaxRes || image === yt.thumbnailHq || image === '/indus3-logo.webp') {
                          return '';
                        }
                        return image;
                      })()}
                      onChange={(e) => setImage(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImg}
                      title="Subir imagen horizontal a api.indus3pro.com"
                    >
                      {uploadingImg ? '⏳ Subiendo...' : '📤 Subir Imagen 16:9'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => {
                        setGalleryTarget('post');
                        setGalleryOpen(true);
                        fetchGallery();
                      }}
                      title="Abrir galería de imágenes del servidor"
                    >
                      🖼️ Galería
                    </button>
                    {(() => {
                      const yt = parseYouTubeVideo(video);
                      const isCustom = image && image !== '/indus3-logo.webp' && image !== yt.thumbnailMaxRes && image !== yt.thumbnailHq;
                      if (!isCustom) return null;
                      return (
                        <button
                          type="button"
                          className={styles.btnSmall}
                          onClick={() => {
                            setImage(yt.thumbnailMaxRes || yt.thumbnailHq || '/indus3-logo.webp');
                          }}
                          title="Restablecer y usar la miniatura oficial de YouTube"
                        >
                          🔄 Usar miniatura YouTube
                        </button>
                      );
                    })()}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.35rem', lineHeight: '1.4' }}>
                    💡 <strong>Para Shorts y Videos Verticales:</strong> La card recortará automáticamente el thumbnail de YouTube a 16:9 horizontal. Si prefieres un arte o flyer horizontal diseñado especialmente en 16:9, súbelo o colócalo aquí.
                  </span>
                </div>

                {/* Extracto / Resumen breve del Video (Opcional) */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    <span>Extracto / Resumen breve del Video (Opcional - se mostrará en la Card):</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Opcional</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Escribe un extracto o descripción breve que aparecerá en la card del video si lo deseas. Si lo dejas vacío, la card no mostrará extracto..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={2}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Tanto el título como el extracto se verán completos en la tarjeta, sin puntos suspensivos (...) de recorte.
                  </span>
                </div>

                {/* Autor del Video */}
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className={styles.label} style={{ marginBottom: 0 }}>
                      Autor del Video:
                    </label>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={handleOpenNewAuthor}
                      title="Crear un nuevo autor"
                    >
                      + Crear Nuevo Autor
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      className={styles.select}
                      value={autorId}
                      onChange={(e) => setAutorId(Number(e.target.value))}
                      style={{ flex: 1 }}
                    >
                      {autores.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre} ({a.rol})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={handleEditCurrentAuthor}
                      title="Editar datos del autor"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                </div>

                {/* Fecha de Publicación del Video */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span>Fecha de Publicación del Video:</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="date"
                      className={styles.input}
                      value={createdAt}
                      onChange={(e) => setCreatedAt(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => setCreatedAt(new Date().toISOString().split('T')[0])}
                      title="Establecer fecha de hoy"
                    >
                      📅 Hoy
                    </button>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Fecha en la que el video se publicó. Se mostrará en la card junto al autor.
                  </span>
                </div>

                {/* Previsualización en Vivo de la Card 16:9 */}
                {(() => {
                  const yt = parseYouTubeVideo(video);
                  const isCustom = image && image !== '/indus3-logo.webp' && image !== yt.thumbnailMaxRes && image !== yt.thumbnailHq;
                  const previewImg = isCustom
                    ? image
                    : (yt.thumbnailMaxRes || yt.thumbnailHq || '/indus3-logo.webp');
                  const currentAuthorObj = autores.find((a) => a.id === autorId) || autores[0];

                  return (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label className={styles.label}>
                        <span>👁️ Previsualización en Vivo de la Card (16:9 Horizontal):</span>
                        <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>
                          {isCustom ? '🖼️ Imagen horizontal personalizada' : '📹 Miniatura oficial de YouTube'}
                        </span>
                      </label>
                      <div className={styles.videoCardPreviewWrapper}>
                        <div className={styles.videoPreviewCard}>
                          <div className={styles.videoPreviewThumbWrapper}>
                            <img
                              src={previewImg}
                              alt={title || 'Preview'}
                              className={styles.videoPreviewThumb}
                              onError={(e) => {
                                if (yt.thumbnailHq && e.target.src !== yt.thumbnailHq) {
                                  e.target.src = yt.thumbnailHq;
                                } else {
                                  e.target.src = '/indus3-logo.webp';
                                }
                              }}
                            />
                            <div className={styles.videoPreviewOverlay} />
                            <span className={styles.videoPreviewBadge}>
                              {yt.isShort ? '⚡ SHORT' : '▶ VIDEO'}
                            </span>
                            <div className={styles.videoPreviewPlay}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            </div>
                          </div>

                          <div className={styles.videoPreviewBody}>
                            {selectedTagIds.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {availableTags
                                  .filter((t) => selectedTagIds.includes(t.id))
                                  .map((t) => (
                                    <span
                                      key={t.id}
                                      style={{
                                        fontSize: '0.72rem',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '20px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#cbd5e1'
                                      }}
                                    >
                                      #{t.nombre}
                                    </span>
                                  ))}
                              </div>
                            )}

                            <h4 className={styles.videoPreviewTitle}>
                              {title || 'Título del Video...'}
                            </h4>

                            {excerpt && excerpt.trim() !== '' && (
                              <p className={styles.videoPreviewExcerpt}>
                                {excerpt}
                              </p>
                            )}

                            <div className={styles.videoPreviewFooter}>
                              <span className={styles.videoPreviewAuthor}>
                                {currentAuthorObj?.nombre || 'Equipo Indus3'}
                              </span>
                              <span className={styles.videoPreviewDate}>
                                {createdAt || 'Fecha'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Estado de Publicación */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span>Estado de la Publicación:</span>
                    <span style={{ color: status === 'published' ? '#4ade80' : '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>
                      {status === 'published' ? '🟢 En línea' : '🟡 Oculto (Borrador)'}
                    </span>
                  </label>
                  <select
                    className={styles.select}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="published">🟢 Publicado (Visible en el blog)</option>
                    <option value="draft">🟡 Borrador (Oculto al público)</option>
                  </select>
                </div>

                {/* Prioridad Destacado */}
                <div className={styles.formGroup} style={{ justifyContent: 'center' }}>
                  <label className={styles.label}>
                    <span>Prioridad en Blog:</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                    <div>
                      <span style={{ fontWeight: 600, color: '#ffffff', display: 'block' }}>⭐ Marcar como video destacado</span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Aparecerá en los primeros puestos del blog.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Etiquetas (Tags) */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    <span>Etiquetas (Tags - Opcional para filtrar en la grilla):</span>
                  </label>
                  <div className={styles.tagsContainer}>
                    {availableTags.map((t) => {
                      const isSelected = selectedTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className={`${styles.tagPill} ${isSelected ? styles.tagPillActive : ''}`}
                          onClick={() => toggleTag(t.id)}
                        >
                          {isSelected ? '✓ ' : '+ '}#{t.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slug Interno */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    <span>Slug Interno (identificador único para base de datos):</span>
                    {slugStatus.checking && (
                      <span className={`${styles.slugStatus} ${styles.slugChecking}`}>⏳ Comprobando...</span>
                    )}
                    {slugStatus.available === true && (
                      <span className={`${styles.slugStatus} ${styles.slugAvailable}`}>✓ {slugStatus.message}</span>
                    )}
                    {slugStatus.available === false && (
                      <span className={`${styles.slugStatus} ${styles.slugUnavailable}`}>✗ {slugStatus.message}</span>
                    )}
                  </label>
                  <div className={styles.slugWrapper}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="video-danny-ocean-en-vivo"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugStatus({ checking: false, available: null, message: '' });
                      }}
                      onBlur={() => checkSlugAvailability(slug)}
                      required
                    />
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={handleCleanManualSlug}
                    >
                      🛠️ Formatear
                    </button>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => checkSlugAvailability(slug)}
                    >
                      🔍 Comprobar
                    </button>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    ℹ️ <strong>Importante:</strong> Para este video NO se creará una página web individual en <code>/blog/slug/</code>. Al hacer clic en su card se abrirá directamente el reproductor interactivo en un modal dentro de la misma página.
                  </span>
                </div>
              </div>
            </fieldset>
          ) : (
            /* ===============================================================
               MODALIDAD ARTÍCULO TRADICIONAL
               =============================================================== */
            <>
              {/* Fieldset 1: Información Principal, SEO y Estado */}
              <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              📝 1. Información General, SEO y Estado
            </legend>
            <div className={styles.fieldsetGrid}>
              {/* Título H1 Principal */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Título H1 (Principal de la Noticia y para la Card):</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Requerido</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ej: Indus3 Pro anuncia nueva edición del festival..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Estado de Publicación */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Estado de la Publicación:</span>
                  <span style={{ color: status === 'published' ? '#4ade80' : '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>
                    {status === 'published' ? '🟢 En línea' : '🟡 Oculto (Borrador)'}
                  </span>
                </label>
                <select
                  className={styles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="published">🟢 Publicado (Visible en el blog)</option>
                  <option value="draft">🟡 Borrador (Oculto al público)</option>
                </select>
              </div>

              {/* Título SEO */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Título SEO (Meta Title para Google / Pestaña):</span>
                  <span
                    className={`${styles.charCounter} ${
                      (seoTitle || title).length <= 60
                        ? styles.charCounterOk
                        : (seoTitle || title).length <= 70
                        ? styles.charCounterWarn
                        : styles.charCounterOver
                    }`}
                  >
                    {(seoTitle || title).length} / 60 caracteres
                  </span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder={title ? `Por defecto: ${title}` : 'Ej: Festival Indus3 2026 | Entradas y Lineup Oficial'}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Si se deja vacío, Google y el navegador usarán automáticamente el Título H1.
                </span>
              </div>

              {/* Palabras Clave SEO (Keywords) */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Palabras Claves SEO (post.keywords):</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Separadas por comas</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="conciertos caracas, indus3 producciones, festival musica 2026..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Se inyectarán directamente en las metaetiquetas SEO del artículo.
                </span>
              </div>

              {/* Slug con Validación */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>
                  <span>Slug URL (identificador único para el enlace /blog/slug):</span>
                  {slugStatus.checking && (
                    <span className={`${styles.slugStatus} ${styles.slugChecking}`}>
                      ⏳ Comprobando...
                    </span>
                  )}
                  {slugStatus.available === true && (
                    <span className={`${styles.slugStatus} ${styles.slugAvailable}`}>
                      ✓ {slugStatus.message}
                    </span>
                  )}
                  {slugStatus.available === false && (
                    <span className={`${styles.slugStatus} ${styles.slugUnavailable}`}>
                      ✗ {slugStatus.message}
                    </span>
                  )}
                </label>
                <div className={styles.slugWrapper}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="nueva-edicion-festival-indus3"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugStatus({ checking: false, available: null, message: '' });
                    }}
                    onBlur={() => checkSlugAvailability(slug)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={handleCleanManualSlug}
                    title="Corregir y formatear el slug (reemplaza acentos, espacios y caracteres especiales)"
                  >
                    🛠️ Corregir Slug
                  </button>
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={() => checkSlugAvailability(slug)}
                    title="Comprobar si el slug ya existe en la base de datos"
                  >
                    🔍 Comprobar
                  </button>
                </div>
              </div>

              {/* Extracto con límite recomendado */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>
                  <span>Extracto / Resumen breve (para la tarjeta del blog y SEO):</span>
                  <span
                    className={`${styles.charCounter} ${
                      excerpt.length <= 160
                        ? styles.charCounterOk
                        : excerpt.length <= 200
                        ? styles.charCounterWarn
                        : styles.charCounterOver
                    }`}
                  >
                    {excerpt.length} / 160 caracteres (recomendado)
                  </span>
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="Breve descripción que se mostrará en las cards de la web y meta descripción de Google (recomendado entre 120 y 160 caracteres)..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  maxLength={240}
                  required
                />
              </div>

              {/* Etiquetas (Tags) */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>
                    <span>Etiquetas (Tags asociadas):</span>
                  </label>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setTagModalOpen(true)}
                    title="Abrir gestor para editar o eliminar etiquetas existentes"
                  >
                    ⚙️ Gestionar / Editar / Eliminar Etiquetas ({availableTags.length})
                  </button>
                </div>
                <div className={styles.tagsContainer}>
                  {availableTags.map((t) => {
                    const isSelected = selectedTagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`${styles.tagPill} ${isSelected ? styles.tagPillActive : ''}`}
                        onClick={() => toggleTag(t.id)}
                      >
                        {isSelected ? '✓ ' : '+ '}#{t.nombre}
                      </button>
                    );
                  })}
                </div>
                <div className={styles.newTagRow} style={{ flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Nombre de etiqueta (ej: Concierto)"
                    value={newTagNameInput}
                    onChange={(e) => setNewTagNameInput(e.target.value)}
                    style={{ maxWidth: '240px' }}
                  />
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Slug (ej: concierto - opcional)"
                    value={newTagSlugInput}
                    onChange={(e) => setNewTagSlugInput(e.target.value)}
                    style={{ maxWidth: '180px' }}
                  />
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={handleAddNewTag}
                  >
                    + Agregar Etiqueta
                  </button>
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={() => setTagModalOpen(true)}
                    title="Editar nombres, slugs o eliminar etiquetas"
                  >
                    ✏️ Gestionar Todas
                  </button>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Fieldset 2: Portada y Multimedia */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              🖼️ 2. Multimedia (Portada y Video)
            </legend>
            <div className={styles.fieldsetGrid}>
              {/* Imagen de Portada con Subida y Galería */}
              <div className={styles.formGroup}>
                <label className={styles.label}>URL Imagen de Portada (Thumbnail / SEO):</label>
                <div className={styles.imageActionsRow}>
                  {image && (
                    <img
                      src={image}
                      alt="Preview"
                      className={styles.imagePreviewThumb}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="/indus3-logo.webp o URL externa"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImg}
                    title="Subir imagen a api.indus3pro.com/blog/galeria"
                  >
                    {uploadingImg ? '⏳ Subiendo...' : '📤 Subir Imagen'}
                  </button>
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={() => {
                      setGalleryTarget('post');
                      setGalleryOpen(true);
                      fetchGallery();
                    }}
                    title="Abrir galería de imágenes del servidor"
                  >
                    🖼️ Galería
                  </button>
                </div>
              </div>

              {/* Video Principal Destacado */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>URL Video Principal (YouTube - Opcional):</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="https://youtu.be/... (Sustituye la imagen de portada)"
                  value={video}
                  onChange={(e) => setVideo(e.target.value)}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Si se especifica, el reproductor de YouTube reemplazará la imagen de cabecera en el artículo.
                </span>
              </div>
            </div>
          </fieldset>

          {/* Fieldset 3: Autoría, Publicación y Destacado */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              👤 3. Autoría, Publicación y Destacado
            </legend>
            <div className={styles.fieldsetGrid}>
              {/* Autor */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>
                    Autor del Artículo:
                  </label>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={handleOpenNewAuthor}
                    title="Crear un nuevo autor de artículos"
                  >
                    + Crear Nuevo Autor
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    className={styles.select}
                    value={autorId}
                    onChange={(e) => setAutorId(Number(e.target.value))}
                    style={{ flex: 1 }}
                  >
                    {autores.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} ({a.rol})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={handleEditCurrentAuthor}
                    title="Editar los datos, biografía y foto del autor seleccionado"
                  >
                    ✏️ Editar Autor
                  </button>
                </div>
                {/* Vista previa compacta del autor */}
                {(() => {
                  const currentAutor = autores.find((a) => a.id === autorId);
                  if (!currentAutor) return null;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
                      <img
                        src={currentAutor.avatar || '/indus3-logo.webp'}
                        alt={currentAutor.nombre}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #3b82f6' }}
                        onError={(e) => { e.target.src = '/indus3-logo.webp'; }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {currentAutor.rol}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Fecha de Publicación */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>
                    <span>Fecha de Publicación:</span>
                  </label>
                  {postId > 0 && updatedAt && (
                    <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600 }}>
                      🕒 Modificado: {updatedAt.split(' ')[0]}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="date"
                    className={styles.input}
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={() => setCreatedAt(new Date().toISOString().split('T')[0])}
                    title="Establecer fecha de hoy"
                  >
                    📅 Hoy
                  </button>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {postId > 0
                    ? 'Puedes cambiar la fecha de publicación si necesitas corregirla o programarla.'
                    : 'Fecha con la que se publicará el artículo en el blog (por defecto, hoy).'}
                </span>
              </div>

              {/* Tiempo de Lectura */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>
                    Tiempo de Lectura:
                  </label>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {calculateWordCount(content)} palabras (~{Math.max(1, Math.ceil(calculateWordCount(content) / 200))} min)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="4 min de lectura"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    style={{ flex: 1, minWidth: '160px' }}
                  />
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={() => {
                      const words = calculateWordCount(content);
                      const mins = Math.max(1, Math.ceil(words / 200));
                      setReadTime(`${mins} min de lectura`);
                    }}
                    title="Calcular automáticamente en base al total de palabras del artículo"
                  >
                    ⚡ Auto-calcular ({Math.max(1, Math.ceil(calculateWordCount(content) / 200))} min)
                  </button>
                </div>
                <div className={styles.readTimeTip}>
                  💡 <strong>Tip de Tiempo de Lectura:</strong> Una persona promedio lee entre <strong>200 y 250 palabras por minuto</strong>.
                  Fórmula: <code>Minutos = Palabras ÷ 200</code>. Presiona el botón <strong>⚡ Auto-calcular</strong> para actualizar los minutos según el texto actual.
                </div>
              </div>

              {/* Destacado */}
              <div className={styles.formGroup} style={{ justifyContent: 'center' }}>
                <label className={styles.label}>
                  <span>Prioridad en Blog:</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: '#ffffff', display: 'block' }}>⭐ Marcar como noticia destacada</span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Las noticias destacadas se posicionan al principio de la lista del blog.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </fieldset>

          {/* Editor de Contenido HTML con Previsualización */}
          <div className={styles.editorSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label} style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa', marginBottom: 0 }}>
                📝 Contenido del Artículo (Editor HTML interactivo)
              </label>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Visualizador interactivo en tiempo real
              </span>
            </div>

            <div className={styles.editorCard}>
              {/* Toolbar sin salto de scroll */}
              <div className={styles.editorToolbar}>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertSnippet('<h2>', '</h2>')}
                  title="Insertar Encabezado H2"
                >
                  H2
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertSnippet('<h3>', '</h3>')}
                  title="Insertar Encabezado H3"
                >
                  H3
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertSnippet('<p>', '</p>')}
                  title="Insertar Párrafo"
                >
                  ¶ Párrafo
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertSnippet('<strong>', '</strong>')}
                  title="Negrita"
                >
                  <b>B</b>
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertSnippet('<em>', '</em>')}
                  title="Cursiva"
                >
                  <i>I</i>
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertSnippet('<blockquote>\n  "', '"\n</blockquote>')}
                  title="Insertar Cita"
                >
                  ❝ Cita
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertSnippet('<ul>\n  <li>', '</li>\n  <li>Elemento 2</li>\n</ul>')}
                  title="Lista con viñetas"
                >
                  • Lista
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertSnippet('<ol>\n  <li>', '</li>\n  <li>Paso 2</li>\n</ol>')}
                  title="Lista numerada"
                >
                  1. Lista
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertSnippet('<a href="https://" target="_blank" rel="noopener noreferrer">', '</a>')}
                  title="Insertar Enlace"
                >
                  🔗 Link
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() =>
                    insertSnippet(
                      '<div style="background: rgba(59,130,246,0.12); border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 8px; margin: 1.5rem 0;">\n  💡 <strong>Información Destacada:</strong> ',
                      '\n</div>'
                    )
                  }
                  title="Caja de Nota / Consejo"
                >
                  💡 Info Box
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => {
                    setGalleryTarget('editor');
                    setEditorImageUrl('');
                    setEditorImageAlt('');
                    setEditorImageSource('url');
                    setEditorImageModalOpen(true);
                  }}
                  title="Insertar imagen con URL, subida de archivo o desde la galería"
                >
                  🖼️ Imagen
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => {
                    setGalleryTarget('editor');
                    setEditorImageModalOpen(false);
                    setGalleryOpen(true);
                    fetchGallery();
                  }}
                  title="Abrir galería para insertar una imagen en el contenido del artículo"
                >
                  🖼️ Galería
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() =>
                    insertSnippet(
                      '\n<div class="indus3-columns-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.75rem; margin: 1.75rem 0;">\n  <div>\n    <h3>Columna 1</h3>\n    <p>Escribe aquí el contenido o inserta una imagen para la primera columna...</p>\n  </div>\n  <div>\n    <h3>Columna 2</h3>\n    <p>Escribe aquí el contenido o inserta una imagen para la segunda columna...</p>\n  </div>\n</div>\n'
                    )
                  }
                  title="Insertar diseño responsivo de 2 columnas"
                >
                  🍱 2 Columnas
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => {
                    const ytUrl = prompt('Pega el enlace del video o short de YouTube:');
                    if (!ytUrl) return;

                    const match =
                      ytUrl.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i) ||
                      ytUrl.trim().match(/^([\w-]{11})$/);

                    if (!match) {
                      alert('El enlace de YouTube no parece válido. Por favor pega un enlace completo (ej: https://www.youtube.com/watch?v=... o https://youtube.com/shorts/...)');
                      return;
                    }

                    const videoId = match[1];
                    const isShort = ytUrl.includes('/shorts/');

                    if (isShort) {
                      insertSnippet(
                        `\n<div class="videoWrapper videoWrapperShort" style="position: relative; aspect-ratio: 9/16; max-width: 380px; margin: 1.75rem auto; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"><iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`
                      );
                    } else {
                      insertSnippet(
                        `\n<div class="videoWrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 8px 24px rgba(0,0,0,0.4);"><iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`
                      );
                    }
                  }}
                  title="Insertar Video o Short de YouTube dentro del contenido"
                >
                  🎥 Video / Short
                </button>

                {/* Selector de vista */}
                <div className={styles.viewModeToggle}>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${viewMode === 'split' ? styles.viewBtnActive : ''}`}
                    onClick={() => setViewMode('split')}
                  >
                    Dividido
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${viewMode === 'code' ? styles.viewBtnActive : ''}`}
                    onClick={() => setViewMode('code')}
                  >
                    Código
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${viewMode === 'preview' ? styles.viewBtnActive : ''}`}
                    onClick={() => setViewMode('preview')}
                  >
                    Vista Previa
                  </button>
                </div>
              </div>

              {/* Área de edición y preview */}
              <div className={viewMode === 'split' ? styles.splitEditor : styles.singleEditor}>
                {(viewMode === 'split' || viewMode === 'code') && (
                  <textarea
                    ref={textareaRef}
                    className={styles.htmlTextarea}
                    placeholder="Escribe o pega el contenido HTML aquí..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                )}

                {(viewMode === 'split' || viewMode === 'preview') && (
                  <div className={styles.previewBox}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                      PREVISUALIZACIÓN EN VIVO (INDUS3)
                    </div>
                    {content ? (
                      <div dangerouslySetInnerHTML={{ __html: content }} />
                    ) : (
                      <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                        El contenido previsualizado se mostrará aquí conforme escribas...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
          )}

          {/* Guardar post */}
          <div className={styles.actionRow}>
            {saveStatus.message && (
              <span
                style={{
                  color: saveStatus.error ? '#f87171' : '#4ade80',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                {saveStatus.message}
              </span>
            )}
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={saveStatus.saving}
            >
              {saveStatus.saving
                ? 'Guardando...'
                : postId > 0
                ? (postType === 'video' ? 'Actualizar Video Modal' : 'Actualizar Noticia')
                : (postType === 'video' ? 'Guardar Video en Base de Datos' : 'Guardar Noticia en Base de Datos')}
            </button>
            {slug && postType !== 'video' && (
              <a
                href={`/blog/${slug.trim()}/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.1rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  background: 'rgba(59, 130, 246, 0.12)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                title="Abrir la URL directa del artículo en una nueva pestaña"
              >
                👁️ {status === 'draft' ? 'Previsualizar Borrador' : 'Ver en la Web'}
              </a>
            )}
          </div>
        </form>
      ) : (
        /* Vista de Listado / Gestión de Noticias */
        <div className={styles.tableCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, color: '#ffffff' }}>Listado de Noticias en Base de Datos</h3>
            <button
              type="button"
              className={styles.btnSmall}
              onClick={fetchExistingPosts}
            >
              🔄 Recargar
            </button>
          </div>

          {loadingPosts ? (
            <p style={{ color: '#94a3b8' }}>Cargando publicaciones...</p>
          ) : existingPosts.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>
              No se encontraron noticias en la base de datos todavía. ¡Crea la primera usando la pestaña de arriba!
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Slug</th>
                  <th>Autor</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {existingPosts.map((post) => (
                  <tr key={post.id}>
                    <td>#{post.id}</td>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {String(post.read_time || '').toLowerCase() === 'video' || (!post.content && post.video) ? (
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            fontWeight: 700
                          }}>
                            🎬 Video
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            fontWeight: 700
                          }}>
                            📰 Artículo
                          </span>
                        )}
                        <span>{post.title}</span>
                      </div>
                    </td>
                    <td style={{ color: '#60a5fa' }}>
                      {String(post.read_time || '').toLowerCase() === 'video' || (!post.content && post.video) ? (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }} title="Este video se reproduce en modal directo en la card del blog">
                          (Modal directo)
                        </span>
                      ) : (
                        `/${post.slug}/`
                      )}
                    </td>
                    <td>{post.autor_nombre || 'Equipo Indus3'}</td>
                    <td>
                      <span
                        style={{
                          background: post.status === 'published' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                          color: post.status === 'published' ? '#4ade80' : '#facc15',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        {post.status === 'published' ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      <div>{post.created_at ? post.created_at.split(' ')[0] : '-'}</div>
                      {post.updated_at && post.updated_at.split(' ')[0] !== (post.created_at ? post.created_at.split(' ')[0] : '') && (
                        <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '2px' }} title={`Última modificación: ${post.updated_at}`}>
                          Act: {post.updated_at.split(' ')[0]}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className={styles.btnSmall}
                          onClick={() => handleEditPost(post)}
                        >
                          ✏️ Editar
                        </button>
                        {String(post.read_time || '').toLowerCase() === 'video' || (!post.content && post.video) ? (
                          post.video ? (
                            <a
                              href={post.video}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.btnSmall}
                              style={{ textDecoration: 'none', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                              title="Abrir video en YouTube"
                            >
                              ▶ YouTube
                            </a>
                          ) : null
                        ) : (
                          <a
                            href={`/blog/${post.slug}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnSmall}
                            style={{ textDecoration: 'none' }}
                          >
                            👁️ Ver
                          </a>
                        )}
                        <button
                          type="button"
                          className={styles.btnSmallDanger}
                          onClick={() => handleDeletePost(post.id, post.title)}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal de Galería de Imágenes (Portal centrado en pantalla con soporte de Carpetas y Búsqueda) */}
      {galleryOpen && typeof document !== 'undefined' && createPortal(
        <div className={styles.modalOverlay} onClick={() => setGalleryOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>🖼️ Galería de Imágenes - Indus3</h3>
                {galleryTarget === 'editor' && (
                  <span style={{ fontSize: '0.78rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>
                    Destino: 📝 Contenido HTML del Artículo
                  </span>
                )}
                {galleryTarget === 'post' && (
                  <span style={{ fontSize: '0.78rem', color: '#fef08a', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.35)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>
                    Destino: 🖼️ Imagen de Portada (Thumbnail)
                  </span>
                )}
                {galleryTarget === 'author' && (
                  <span style={{ fontSize: '0.78rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>
                    Destino: 👤 Foto del Autor
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setGalleryOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Barra de Filtros y Carpetas */}
              <div className={styles.galleryFilterBar}>
                <div className={styles.galleryFoldersRow}>
                  <button
                    type="button"
                    className={`${styles.folderPill} ${selectedGalleryFolder === 'todas' ? styles.folderPillActive : ''}`}
                    onClick={() => setSelectedGalleryFolder('todas')}
                  >
                    📁 Todas ({galleryImages.length})
                  </button>
                  {galleryFolders.map((f) => {
                    const count = galleryImages.filter(
                      (img) => (img.folder || 'general').toLowerCase() === f.toLowerCase()
                    ).length;
                    return (
                      <button
                        key={f}
                        type="button"
                        className={`${styles.folderPill} ${selectedGalleryFolder === f ? styles.folderPillActive : ''}`}
                        onClick={() => {
                          setSelectedGalleryFolder(f);
                          setUploadFolder(f);
                        }}
                      >
                        📁 {f} ({count})
                      </button>
                    );
                  })}
                  {/* Crear nueva carpeta */}
                  <form
                    onSubmit={handleCreateFolder}
                    style={{ display: 'inline-flex', gap: '0.35rem', marginLeft: 'auto' }}
                  >
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Nueva carpeta..."
                      value={newFolderNameInput}
                      onChange={(e) => setNewFolderNameInput(e.target.value)}
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: '130px' }}
                    />
                    <button
                      type="submit"
                      className={styles.btnSmall}
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                      disabled={creatingFolder}
                    >
                      {creatingFolder ? '...' : '+ Carpeta'}
                    </button>
                  </form>
                </div>

                {/* Fila de Búsqueda y Subida con Selector de Carpeta */}
                <div className={styles.gallerySearchRow}>
                  <input
                    type="text"
                    className={styles.gallerySearchInput}
                    placeholder="🔍 Buscar imagen por nombre de archivo..."
                    value={gallerySearchQuery}
                    onChange={(e) => setGallerySearchQuery(e.target.value)}
                  />

                  <div className={styles.galleryUploadControls}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Carpeta destino:</span>
                    <select
                      className={styles.select}
                      value={uploadFolder}
                      onChange={(e) => setUploadFolder(e.target.value)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', width: 'auto' }}
                    >
                      {galleryFolders.map((f) => (
                        <option key={f} value={f}>
                          📁 {f}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImg}
                      title="Subir archivo a la carpeta seleccionada"
                    >
                      {uploadingImg ? '⏳ Subiendo...' : '📤 Subir Nueva'}
                    </button>
                  </div>
                </div>
              </div>

              {loadingGallery ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Cargando galería...</p>
              ) : (() => {
                const filteredImages = galleryImages.filter((img) => {
                  const matchesFolder =
                    selectedGalleryFolder === 'todas' ||
                    (img.folder || 'general').toLowerCase() === selectedGalleryFolder.toLowerCase();
                  const matchesSearch =
                    !gallerySearchQuery ||
                    img.filename.toLowerCase().includes(gallerySearchQuery.toLowerCase());
                  return matchesFolder && matchesSearch;
                });

                if (filteredImages.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      <p>No se encontraron imágenes en esta carpeta o con ese nombre.</p>
                      <p style={{ fontSize: '0.85rem' }}>Usa el botón "Subir Nueva" para agregar imágenes a <strong>{uploadFolder}</strong>.</p>
                    </div>
                  );
                }

                return (
                  <div className={styles.galleryGrid}>
                    {filteredImages.map((img) => (
                      <div
                        key={img.url || img.filename}
                        className={styles.galleryItem}
                        style={{ position: 'relative' }}
                        onClick={() => {
                          if (galleryTarget === 'author') {
                            setAuthorAvatar(img.url);
                          } else if (galleryTarget === 'editor') {
                            setEditorImageUrl(img.url);
                            if (!editorImageAlt.trim()) {
                              const cleanName = img.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                              setEditorImageAlt(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                            }
                            setEditorImageModalOpen(true);
                          } else {
                            setImage(img.url);
                          }
                          setGalleryOpen(false);
                        }}
                        title={`Seleccionar ${img.filename} (${img.folder || 'general'})`}
                      >
                        <span className={styles.galleryItemFolderBadge}>
                          📁 {img.folder || 'general'}
                        </span>
                        <img
                          src={img.url}
                          alt={img.filename}
                          className={styles.galleryThumb}
                          loading="lazy"
                        />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.4rem' }}>
                          <span className={styles.galleryItemLabel} style={{ padding: 0 }}>
                            {img.filename}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteGalleryImage(e, img)}
                            title="Eliminar esta imagen del servidor"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0 0.2rem',
                              fontSize: '0.8rem'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para Insertar Imagen en el Editor HTML con opciones (Portal centrado en pantalla) */}
      {editorImageModalOpen && typeof document !== 'undefined' && createPortal(
        <div className={styles.modalOverlay} onClick={() => setEditorImageModalOpen(false)}>
          <div className={styles.editorImageModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🖼️ Insertar Imagen en el Artículo</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditorImageModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Selector de origen: URL directa vs Subir imagen vs Galería */}
              <div className={styles.sourceTabsRow}>
                <button
                  type="button"
                  className={`${styles.sourceTabBtn} ${editorImageSource === 'url' ? styles.sourceTabBtnActive : ''}`}
                  onClick={() => setEditorImageSource('url')}
                >
                  🔗 Tengo la URL
                </button>
                <button
                  type="button"
                  className={`${styles.sourceTabBtn} ${editorImageSource === 'upload' ? styles.sourceTabBtnActive : ''}`}
                  onClick={() => setEditorImageSource('upload')}
                >
                  📤 Subir desde PC
                </button>
                <button
                  type="button"
                  className={styles.sourceTabBtn}
                  onClick={() => {
                    setGalleryTarget('editor');
                    setEditorImageModalOpen(false);
                    setGalleryOpen(true);
                    fetchGallery();
                  }}
                  title="Seleccionar una imagen existente de la galería"
                >
                  🖼️ Elegir de Galería
                </button>
              </div>

              <form onSubmit={handleInsertEditorImage} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {editorImageSource === 'url' ? (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span>URL de la Imagen:</span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Enlace web directo</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="https://ejemplo.com/imagen.jpg o /indus3-logo.webp"
                      value={editorImageUrl}
                      onChange={(e) => setEditorImageUrl(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label className={styles.label} style={{ marginBottom: 0 }}>
                        Subir archivo desde tu dispositivo:
                      </label>
                      {uploadFolder && (
                        <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600 }}>
                          Carpeta destino: 📁 {uploadFolder}
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={editorFileInputRef}
                      accept="image/*"
                      onChange={handleEditorImageUpload}
                      style={{ display: 'none' }}
                    />
                    <div
                      className={styles.uploadDropZone}
                      onClick={() => editorFileInputRef.current?.click()}
                    >
                      <div style={{ fontSize: '2.2rem' }}>{editorImageUploading ? '⏳' : '📤'}</div>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.95rem' }}>
                        {editorImageUploading ? 'Subiendo imagen al servidor...' : 'Haz clic aquí para seleccionar una imagen'}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Soporta JPG, PNG, WebP, GIF, AVIF, SVG (se subirá a la carpeta de la galería)
                      </span>
                    </div>

                    {editorImageUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
                        <span style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 600 }}>✓ Subida exitosa:</span>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {editorImageUrl}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Campo de Texto Alternativo (Alt Text) */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span>Texto Alternativo (Alt) para SEO y accesibilidad:</span>
                    <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>Recomendado</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Describe brevemente la imagen (ej: Concierto en vivo de SanLuis en el Poliedro)"
                    value={editorImageAlt}
                    onChange={(e) => setEditorImageAlt(e.target.value)}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    El texto alternativo es esencial para el posicionamiento en Google Imágenes y para personas con lectores de pantalla.
                  </span>
                </div>

                {/* Previsualización en vivo de la imagen */}
                {editorImageUrl && (
                  <div>
                    <label className={styles.label} style={{ marginBottom: '0.4rem' }}>
                      Previsualización de la imagen:
                    </label>
                    <div className={styles.editorImagePreviewBox}>
                      <img
                        src={editorImageUrl}
                        alt={editorImageAlt || 'Preview'}
                        className={styles.editorImagePreviewImg}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Botones de Acción */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setEditorImageModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
                    disabled={!editorImageUrl || editorImageUploading}
                  >
                    {editorImageUploading ? '⏳ Subiendo...' : '🚀 Insertar en el Editor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
      {tagModalOpen && typeof document !== 'undefined' && createPortal(
        <div className={styles.modalOverlay} onClick={() => setTagModalOpen(false)}>
          <div className={styles.tagModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🏷️ Gestor de Etiquetas - Indus3</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setTagModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                💡 <strong>Cascada automática:</strong> Al eliminar una etiqueta, se removerá automáticamente de todos los artículos que la tengan. Al editar su nombre o slug, se actualizará en cada publicación de inmediato.
              </p>

              {/* Formulario para editar etiqueta seleccionada o crear nueva */}
              {editingTagItem ? (
                <form
                  onSubmit={handleSaveTagEdit}
                  style={{
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid #3b82f6',
                    borderRadius: '10px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                    ✏️ Editando Etiqueta #{editingTagItem.id}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>
                        Nombre de la etiqueta:
                      </label>
                      <input
                        type="text"
                        className={styles.input}
                        value={editingTagItem.nombre}
                        onChange={(e) => setEditingTagItem({ ...editingTagItem, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>
                        Slug URL:
                      </label>
                      <input
                        type="text"
                        className={styles.input}
                        value={editingTagItem.slug}
                        onChange={(e) => setEditingTagItem({ ...editingTagItem, slug: e.target.value })}
                        placeholder="slug-opcional"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => setEditingTagItem(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={styles.saveBtn}
                      style={{ padding: '0.45rem 1.25rem', fontSize: '0.88rem' }}
                      disabled={savingTag}
                    >
                      {savingTag ? 'Guardando...' : '💾 Guardar Cambios'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Nombre de nueva etiqueta..."
                    value={newTagNameInput}
                    onChange={(e) => setNewTagNameInput(e.target.value)}
                    style={{ flex: 1, minWidth: '160px' }}
                  />
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="slug (opcional)"
                    value={newTagSlugInput}
                    onChange={(e) => setNewTagSlugInput(e.target.value)}
                    style={{ width: '140px' }}
                  />
                  <button
                    type="button"
                    className={styles.btnSmall}
                    onClick={handleAddNewTag}
                  >
                    + Crear Etiqueta
                  </button>
                </div>
              )}

              {/* Listado de todas las etiquetas con contador de posts */}
              <div className={styles.tagManagerList}>
                {availableTags.map((tag) => (
                  <div key={tag.id} className={styles.tagManagerItem}>
                    <div className={styles.tagManagerInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className={styles.tagManagerName}>#{tag.nombre}</span>
                        <span className={styles.tagManagerBadge}>
                          {tag.total_posts !== undefined ? `${tag.total_posts} ${tag.total_posts === 1 ? 'artículo' : 'artículos'}` : 'Activa'}
                        </span>
                      </div>
                      <span className={styles.tagManagerSlug}>/{tag.slug}/</span>
                    </div>
                    <div className={styles.tagManagerActions}>
                      <button
                        type="button"
                        className={styles.btnSmall}
                        onClick={() => setEditingTagItem({ id: tag.id, nombre: tag.nombre, slug: tag.slug })}
                        title={`Editar nombre y slug de #${tag.nombre}`}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        className={styles.btnSmallDanger}
                        onClick={() => handleDeleteTag(tag.id, tag.nombre)}
                        disabled={deletingTagId === tag.id}
                        title={`Eliminar #${tag.nombre} y desvincular de todos los artículos`}
                      >
                        {deletingTagId === tag.id ? '⏳' : '🗑️ Eliminar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para Crear / Editar Autor (Portal centrado en pantalla) */}
      {authorModalOpen && typeof document !== 'undefined' && createPortal(
        <div className={styles.modalOverlay} onClick={() => setAuthorModalOpen(false)}>
          <div className={styles.authorModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{authorEditingId ? '✏️ Editar Autor' : '👤 Crear Nuevo Autor'}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setAuthorModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Tarjeta de previsualización en vivo */}
              <div className={styles.authorPreviewCard}>
                <img
                  src={authorAvatar || '/indus3-logo.webp'}
                  alt={authorNombre || 'Avatar'}
                  className={styles.authorAvatarPreview}
                  onError={(e) => { e.target.src = '/indus3-logo.webp'; }}
                />
                <div className={styles.authorPreviewDetails}>
                  <h4 className={styles.authorPreviewName}>
                    {authorNombre || 'Nombre del Autor'}
                  </h4>
                  <span className={styles.authorPreviewRole}>
                    {authorRol || 'Rol / Título'}
                  </span>
                  <p className={styles.authorPreviewBio}>
                    {authorBio || 'Biografía que aparecerá al pie de cada artículo escrito por este autor...'}
                  </p>
                </div>
              </div>

              {/* Formulario de Autor */}
              <form onSubmit={handleSaveAuthor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre del Autor:</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Ej: Equipo Indus3, Nombre del redactor..."
                    value={authorNombre}
                    onChange={(e) => setAuthorNombre(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Rol / Cargo:</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Ej: Productor Ejecutivo, Redactor, etc."
                    value={authorRol}
                    onChange={(e) => setAuthorRol(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Foto de Perfil / Avatar:</label>
                  <div className={styles.imageActionsRow}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="/indus3-logo.webp o URL externa"
                      value={authorAvatar}
                      onChange={(e) => setAuthorAvatar(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      ref={authorFileInputRef}
                      accept="image/*"
                      onChange={handleAuthorAvatarUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => authorFileInputRef.current?.click()}
                      disabled={uploadingAuthorAvatar}
                      title="Subir foto desde tu dispositivo"
                    >
                      {uploadingAuthorAvatar ? '⏳ Subiendo...' : '📤 Subir Foto'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => {
                        setGalleryTarget('author');
                        setGalleryOpen(true);
                        fetchGallery();
                      }}
                      title="Seleccionar de la galería del servidor"
                    >
                      🖼️ Galería
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Biografía breve (aparece al pie de sus artículos):</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Breve reseña sobre el autor..."
                    value={authorBio}
                    onChange={(e) => setAuthorBio(e.target.value)}
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setAuthorModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={savingAuthor}
                  >
                    {savingAuthor ? 'Guardando...' : (authorEditingId ? '💾 Actualizar Autor' : '💾 Guardar Autor')}
                  </button>
                </div>
              </form>

              {/* Lista de Autores Registrados */}
              {autores.length > 0 && (
                <div className={styles.authorListSection}>
                  <div className={styles.authorListTitle}>Autores registrados (haz clic para editar):</div>
                  <div className={styles.authorListGrid}>
                    {autores.map((a) => (
                      <div
                        key={a.id}
                        className={`${styles.authorChip} ${authorEditingId === a.id ? styles.authorChipActive : ''}`}
                        onClick={() => handleEditAuthor(a)}
                        title={`Editar a ${a.nombre}`}
                      >
                        <img
                          src={a.avatar || '/indus3-logo.webp'}
                          alt={a.nombre}
                          className={styles.authorChipAvatar}
                          onError={(e) => { e.target.src = '/indus3-logo.webp'; }}
                        />
                        <span className={styles.authorChipName}>{a.nombre}</span>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={styles.authorChip}
                      onClick={handleOpenNewAuthor}
                      style={{ borderStyle: 'dashed' }}
                    >
                      <span>+ Crear otro</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BlogManager;

