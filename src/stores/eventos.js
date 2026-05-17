export const urlEventos = "https://api.indus3pro.com/eventos/get-eventos.php?t="+Date.now();

export const getEventos = async () => {
  const response = await fetch(urlEventos, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
    },
  });
  const data = await response.json();
  return data.data;
}
