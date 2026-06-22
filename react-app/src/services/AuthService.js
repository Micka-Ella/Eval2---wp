import axios from 'axios';
import api, { glpiConfig } from '../config/api';

const AuthService = {
    login: async (singleCode) => {
        try {
            if (!singleCode) {
                throw new Error('Code unique requis.');
            }

            const validCode = import.meta.env.VITE_BACKOFFICE_CODE
                || import.meta.env.VITE_SINGLE_AUTH_CODE
                || 'glpi123';
            
            // Vérifier le code unique
            if (singleCode !== validCode) {
                throw new Error('Code unique incorrect.');
            }

            // Utiliser les identifiants glpi/glpi par défaut
            const username = import.meta.env.VITE_GLPI_USERNAME || 'glpi';
            const password = import.meta.env.VITE_GLPI_PASSWORD || 'glpi';

            // On crée le header Basic Auth avec les identifiants fournis
            const authHeader = 'Basic ' + btoa(username + ':' + password);
            const appToken = glpiConfig.appToken;

            let sessionToken;
            try {
                // Appel direct sans l'instance "api" pour forcer la vérification par identifiants
                const response = await axios.get(`${glpiConfig.baseURL}/initSession`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'App-Token': appToken,
                        'Authorization': authHeader
                    }
                });
                sessionToken = response.data.session_token;
                
                // Si réussi, on met à jour l'instance globale
                api.defaults.headers.common['Session-Token'] = sessionToken;
            } catch (authError) {
                // Si l'API retourne une erreur parce que la connexion par identifiants est désactivée
                if (authError.response?.data?.[0] === 'ERROR_LOGIN_WITH_CREDENTIALS_DISABLED') {
                    throw new Error("La connexion par mot de passe est désactivée dans GLPI. Veuillez l'activer dans Configuration > Générale > API.");
                }
                // Si mauvais mot de passe
                if (authError.response?.status === 401 || authError.response?.status === 400) {
                    throw new Error('Identifiant ou mot de passe incorrect.');
                }
                throw new Error("Erreur de connexion au serveur GLPI.");
            }

            // Une fois la session initiée, on récupère les détails du compte
            const userResponse = await api.get(`/User?searchText[name]=${username}`);
            const users = userResponse.data;
            const user = Array.isArray(users) ? users.find(u => u.name === username) : null;

            if (!user) {
                throw new Error('Impossible de récupérer les informations de votre compte.');
            }

            const isActive = user.is_active === 1;

            if (!isActive) {
                throw new Error('Ce compte est désactivé.');
            }

            const userData = {
                id: user.id,
                name: user.name,
                realname: user.realname,
                firstname: user.firstname,
                language: user.language,
                active: isActive
            };

            // On stocke les infos dans le sessionStorage
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('user', JSON.stringify(userData));

            return userData;
        } catch (error) {
            console.error('Erreur Login:', error);
            throw new Error(error.message || 'Erreur lors de la connexion.');
        }
    },

    logout: () => {
        sessionStorage.clear();
        window.location.href = '/login';
    },

    isAuthenticated: () => {
        return sessionStorage.getItem('isAuthenticated') === 'true';
    },

    getCurrentUser: () => {
        const user = sessionStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};

export default AuthService;
