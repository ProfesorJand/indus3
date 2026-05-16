export const urlSliders = "https://api.indus3pro.com/sliders/get-sliders.php?t="+Date.now();

export const getSliders = async () => {
  try {
    const response = await fetch(urlSliders, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.PUBLIC_BACKEND_AUTH_KEY}`
      },
    });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching sliders:", error);
    return [];
  }
}
