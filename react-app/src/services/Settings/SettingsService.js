import axios from 'axios';

const SETTINGS_API_URL = 'http://localhost:3001/api/settings';

const SettingsService = {
  getSettings: async () => {
    try {
      const response = await axios.get(SETTINGS_API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching settings from SQLite:', error);
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      const response = await axios.put(SETTINGS_API_URL, settings);
      if (settings.reopen_ceiling_percentage !== undefined) {
        await axios.post('http://localhost:3001/api/ticket-cost/operations/recalculate-ceilings');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating settings in SQLite:', error);
      throw error;
    }
  }
};

export default SettingsService;
