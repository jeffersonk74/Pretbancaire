// Helper pour obtenir l'URL de base de l'API
// Fonctionne pour localhost et accès réseau local
export const getApiBaseUrl = () => {
  return window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : `http://${window.location.hostname}:3001`;
};

// Helper pour faire des requêtes API
export const apiFetch = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return fetch(url, options);
};
