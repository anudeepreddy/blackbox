import { defineConfig } from "wxt";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  dev: {
    server: {
      port: 5173,
    },
  },
  manifest: {
    name: "Blackbox",
    icons: {
      16: "icon/icon16.png",
      32: "icon/icon32.png",
      48: "icon/icon48.png",
      128: "icon/icon128.png",
    },
    web_accessible_resources: [
      {
        resources: ["inject.js"],
        matches: ["<all_urls>"],
      }
    ],
  },
  vite: () => ({
    plugins: [tailwindcss(), viteStaticCopy({
      targets: [
        { src: 'node_modules/chii/public/front_end/core/i18n/locales', dest: '' },
        { src: 'node_modules/chii/public/front_end/Images/*', dest: '' },
      ]
    })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
    esbuild: {
      charset: "ascii",
    },
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      exclude: ["chii", "chobitsu"],
    },
    server: {
      watch: {
        ignored: ["node_modules/chii/**", "node_modules/chobitsu/**"],
      },
    },
  }),
});
