import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/labs/lab-hoa-sandbox/dist/' : './',
});
