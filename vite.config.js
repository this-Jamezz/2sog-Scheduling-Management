import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function adminEndpoint() {
  function register(server) {
    server.middlewares.use((request, _response, next) => {
      if (/^\/admin(?:\?|$)/.test(request.url)) {
        request.url = request.url.replace('/admin', '/admin/')
      }
      next()
    })
  }
  return { name: '2sog-admin-endpoint', configureServer: register, configurePreviewServer: register }
}

export default defineConfig({
  plugins: [adminEndpoint(), react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        customer: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)),
      },
    },
  },
})
