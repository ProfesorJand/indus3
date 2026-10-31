export const urlSliders = "https://api.indus3pro.com/sliders/get-sliders.php?t="+Date.now();

export const getSliders = async () => {
  try {
    const response = await fetch(urlSliders, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(typeof window !== 'undefined' ? sessionStorage.getItem('indus3_admin_token') : null) || import.meta.env.BACKEND_AUTH_KEY || import.meta.env.PUBLIC_BACKEND_AUTH_KEY || ''}`
      },
    });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching sliders:", error);
    return [];
  }
}
