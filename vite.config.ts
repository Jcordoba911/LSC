import { defineConfig } from 'vite';

// En GitHub Pages el sitio vive en /<repo>/; el workflow de deploy define BASE_PATH.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
});
