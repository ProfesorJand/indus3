export const getEventos = async () => {
  try {
    const response = await fetch("https://api.indus3pro.com/eventos/get-eventos.php?t=" + Date.now(), {
      method: "GET",
      headers: {
        'Content-Type': "application/json",
        'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
      },
    });

    const text = await response.text();
    console.log("RESPONSE STATUS:", response.status);
    console.log("RESPONSE TEXT:", text);

    const data = JSON.parse(text);

    if (!data || !data.data) {
      console.error("Formato inesperado:", data);
      return [];
    }

    return data.data;

  } catch (error) {
    console.error("ERROR FETCH EVENTOS:", error);
    return [];
  }
};