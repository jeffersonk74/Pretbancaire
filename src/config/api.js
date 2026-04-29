// Configuration de l'API
// Utilise l'IP du serveur pour permettre l'accès depuis le réseau local

const getBaseUrl = () => {
  // En production/déploiement, utilise l'URL actuelle
  if (import.meta.env.PROD) {
    return '';
  }
  
  // En développement, utilise l'IP du serveur pour l'accès réseau
  // Remplace par l'IP de ta machine si nécessaire
  const serverIp = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : `http://${window.location.hostname}:3001`;
  
  return serverIp;
};

export const API_BASE_URL = getBaseUrl();

// Helper pour construire les URLs d'API
export const apiUrl = (path) => {
  const base = API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
