import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  return {
    plugins: [tailwindcss(), vercel()],
    server: {
      host: isDev ? true : false,
    },
  };
});
