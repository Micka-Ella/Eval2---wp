import axios from 'axios';

const LOCAL_RESET_API_URL = 'http://localhost:3001/api/reset/local';
const GLPI_AUTOINCREMENT_API_URL = 'http://localhost:3001/api/reset/glpi-auto-increment';

const LocalResetService = {
  resetLocalDatabase: async () => {
    const response = await axios.post(LOCAL_RESET_API_URL);
    return response.data;
  },

  resetGlpiAutoIncrement: async (resources) => {
    const response = await axios.post(GLPI_AUTOINCREMENT_API_URL, { resources });
    return response.data;
  },
};

export default LocalResetService;