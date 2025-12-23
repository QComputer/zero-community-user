import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            onwarn: function (warning, warn) {
                // Suppress the specific Vite warning about incorrect asset paths
                if (warning.message.includes('Instead of /public/')) {
                    return;
                }
                warn(warning);
            },
        },
    },
});
