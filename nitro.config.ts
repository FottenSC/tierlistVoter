import { defineNitroConfig } from 'nitro/config'
import path from 'node:path'

export default defineNitroConfig({
  preset: 'cloudflare-pages',
  output: {
    dir: '.output',
    publicDir: '.output'
  },
  handlers: [
    {
      route: '/**',
      handler: path.resolve(process.cwd(), 'dist/server/server.js')
    }
  ],
  publicAssets: [
    {
      dir: 'dist/client'
    }
  ]
})
