const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./database/init');
const routes = require('./routes/index');

const app = express();

initDatabase();

app.use(cors({ origin: 'http://localhost:5173' })); // URL de Vite
app.use(express.json());

app.use('/api', routes);

// Route de test
app.get('/ping', (req, res) => res.json({ message: '✅ Express OK' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});