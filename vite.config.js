import { defineConfig } from 'vite';

export default defineConfig({
  // base: './' asegura que todas las rutas sean relativas, 
  // permitiendo que el proyecto funcione correctamente en GitHub Pages u otro subdirectorio
  base: './',
  server: {
    // Configura el servidor de desarrollo local
    port: 3000,
    open: true // Abre el navegador por defecto al iniciar el servidor local
  }
});
