import fallbackEventos from '../data/eventos.json';

export const urlEventos = "https://api.indus3pro.com/eventos/get-eventos.php?t="+Date.now();

export const getEventos = async () => {
  try {
    const response = await fetch(urlEventos, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(typeof window !== 'undefined' ? sessionStorage.getItem('indus3_admin_token') : null) || import.meta.env.BACKEND_AUTH_KEY || import.meta.env.PUBLIC_BACKEND_AUTH_KEY || ''}`
    },
  });
    if (!response.ok) return fallbackEventos;
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data && Array.isArray(data.data)) return data.data;
    } catch {
      // Si Imunify360 devuelve HTML
    }
    return fallbackEventos;
  } catch (error) {
    return fallbackEventos;
  }

}
