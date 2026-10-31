import fallbackBiografias from '../data/biografias.json';

export const JOB_TITLE = [
  "Artista Musical",
  "Banda",
  "Duo",
  "Evento",
  "Organización",
  "Productor Musical",
  "DJ",
  "Compositor",
  "Productor",
  "Actor",
  "Actriz",
  "Bailarín",
  "Bailarina",
  "Músico",
  "Música",
  "Cantante",
];

export const TYPE = [
  "artista",
  "banda",
  "duo",
  "evento",
  "organizacion",
];

//solo generos clasicos sin extenciones
export const GENRE = [
  "Pop",
  "Rock",
  "Urbano",
  "Reggaeton",
  "Trap",
  "Electrónica",
  "Indie",
  "Alternativo",
  "R&B",
  "Hip Hop",
  "Salsa",
  "Merengue",
  "Bachata",
  "Cumbia",
  "Folclore",
  "Jazz",
  "Blues",
  "Metal",
  "Punk",
  "Reggae",
  "Balada",
]

export const ROL = [
  "Vocalista",
  "Guitarrista",
  "Bajista",
  "Baterista",
  "Tecladista",
  "Pianista",
  "DJ",
  "Productor",
  "Compositor",
  "Actor",
  "Actriz",
  "Bailarín",
  "Bailarina",
  "Músico",
  "Música",
  "Cantante",
]

export const urlBiografias = "https://api.indus3pro.com/biografias/get-biografias.php?t="+Date.now();

export const getBiografias = async () => {
  try {
    const response = await fetch(urlBiografias, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(typeof window !== 'undefined' ? sessionStorage.getItem('indus3_admin_token') : null) || import.meta.env.BACKEND_AUTH_KEY || import.meta.env.PUBLIC_BACKEND_AUTH_KEY || ''}`
    },
  });
    if (!response.ok) return fallbackBiografias;
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data && Array.isArray(data.data)) return data.data;
    } catch {
      // Si Imunify360 devuelve HTML
    }
    return fallbackBiografias;
  } catch (error) {
    return fallbackBiografias;
  }

}
