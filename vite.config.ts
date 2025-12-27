import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 某些库（如 openai）在浏览器中运行时可能会检查 process.env
    // 这里定义一个空对象防止报错 "process is not defined"
    'process.env': {}
  }
})