import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 移除敏感的 envPrefix，这些变量现在只在后端 Node.js 环境中通过 process.env 获取
  // envPrefix: ['GEMINI_', 'DEEPSEEK_', 'OPENROUTER_', 'DATABASE_', 'ADMIN_'],
  define: {
    'process.env': {}
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Vercel dev 默认端口
        changeOrigin: true
      }
    }
  }
})
