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

export const urlBiografias = "http://api.indus3pro.com/biografias/get-biografias.php?t="+Date.now();

export const getBiografias = async () => {
  const response = await fetch(urlBiografias, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
    }
  });
  const data = await response.json();
  return data.data;
}
