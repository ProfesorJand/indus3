export const urlEventos = "https://api.indus3pro.com/eventos/get-eventos.php?t="+Date.now();

export const getEventos = async () => {
  const response = await fetch(urlEventos, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(typeof window !== 'undefined' ? sessionStorage.getItem('indus3_admin_token') : null) || import.meta.env.BACKEND_AUTH_KEY || import.meta.env.PUBLIC_BACKEND_AUTH_KEY || ''}`
    },
  });
  const data = await response.json();
  return data.data;
}
