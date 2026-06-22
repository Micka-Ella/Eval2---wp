// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       // Toutes les requêtes commençant par /api seront interceptées par Vite
//       '/api': {
//         target: 'http://localhost/glpi/apirest.php', // L'URL de votre backend GLPI
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, '') // Enlève '/api' avant d'envoyer à GLPI
//       }
//     }
//   }


import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const glpiTarget = env.VITE_GLPI_PROXY_TARGET || 'http://127.0.0.1'
  const glpiProxy = {
    target: glpiTarget,
    changeOrigin: true,
    rewrite: (path) => path
      .replace(/^\/api\.php\/v1/, '/apirest.php')
      .replace(/^\/glpi-api/, '/apirest.php'),
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api.php/v1': glpiProxy,
        '/glpi-api': glpiProxy,
      },
    },
  }
})

