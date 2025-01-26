import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
	const isDev = mode === "development";
	return {
		plugins: [tailwindcss()],
		server: {
			host: isDev ? true : false,
		},
	};
});
