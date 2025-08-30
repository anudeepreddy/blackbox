import { defineConfig } from 'wxt';
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  dev: {
    server: {
      port: 5173
    }
  },
  manifest: {
    name: "Blackbox",
    icons: {
      16: "icon/icon16.png",
      32: "icon/icon32.png",
      48: "icon/icon48.png",
      128: "icon/icon128.png"
    },
    "web_accessible_resources":[
      {
        "resources": [ "captureConsole.js" ],
        "matches": [ "<all_urls>" ]
      },
      {
        "resources": [ "captureNetwork.js" ],
        "matches": [ "<all_urls>" ]
      }
    ]
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./")
      }
    },
    esbuild: {
      charset: 'ascii'
    }
  })
});
