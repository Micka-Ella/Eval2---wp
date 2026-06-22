import axios from 'axios';

export const glpiConfig = {
  baseURL: import.meta.env.VITE_GLPI_V1_BASE_URL || import.meta.env.VITE_API_URL || '/api.php/v1',
  appToken: import.meta.env.VITE_GLPI_V1_APP_TOKEN || import.meta.env.VITE_APP_TOKEN,
  userToken: import.meta.env.VITE_GLPI_V1_USER_TOKEN || import.meta.env.VITE_USER_TOKEN,
};

// 1. On crée une instance d'Axios configurée avec notre base URL et nos headers par défaut
const api = axios.create({
  baseURL: glpiConfig.baseURL,
  headers: {
    'Content-Type': 'application/json',
    'App-Token': glpiConfig.appToken,
    'Authorization': `user_token ${glpiConfig.userToken}`,
    'User-Token': glpiConfig.userToken
  }
});

// Variable globale pour stocker le token de session une fois initialisé
let sessionToken = null;

// 2. Fonction pour initialiser la session GLPI
export const initSession = async () => {
  if (sessionToken) return sessionToken; // Si on l'a déjà, on ne refait pas l'appel

  try {
    // On ajoute explicitement le user_token en paramètre de requête pour contourner 
    // la suppression de l'entête Authorization par certaines configurations Apache.
    const response = await api.get('/initSession', {
      params: {
        user_token: glpiConfig.userToken
      }
    });
    sessionToken = response.data.session_token;
    
    // 3. MAGIE D'AXIOS : On injecte automatiquement ce Session-Token
    // dans toutes les futures requêtes que l'on fera avec cette instance 'api' !
    api.defaults.headers.common['Session-Token'] = sessionToken;
    
    return sessionToken;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la session GLPI", error);
    throw error;
  }
};

export default api;
