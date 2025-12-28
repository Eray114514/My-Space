import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 允许 Vite 将以下前缀的环境变量暴露给客户端代码 (import.meta.env)
  envPrefix: ['GEMINI_', 'DEEPSEEK_', 'OPENROUTER_', 'DATABASE_', 'ADMIN_'],
  define: {
    // 某些库（如 openai）在浏览器中运行时可能会检查 process.env
    // 这里定义一个空对象防止报错 "process is not defined"
    'process.env': {}
  }
})