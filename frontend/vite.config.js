import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import { searchPhenoRuns, resolvePhenoFile } from './phenoApi.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'pheno-api',
      configureServer(server) {
        server.middlewares.use('/api/pheno/search', (req, res) => {
          const url = new URL(req.url ?? '', 'http://localhost')
          const runs = searchPhenoRuns({
            date: url.searchParams.get('date'),
            bench: url.searchParams.get('bench'),
            row: url.searchParams.get('row'),
          })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ runs }))
        })

        server.middlewares.use('/pheno-data', (req, res) => {
          const parts = decodeURI(req.url ?? '')
            .split('/')
            .filter(Boolean)
          const [rootId, ...relativeParts] = parts
          const filePath = resolvePhenoFile(rootId, relativeParts)
          if (!filePath) {
            res.statusCode = 404
            res.end('Not found')
            return
          }
          res.setHeader('Cache-Control', 'no-store')
          if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png')
          if (filePath.endsWith('.ply')) res.setHeader('Content-Type', 'application/octet-stream')
          fs.createReadStream(filePath).pipe(res)
        })
      },
    },
  ],
})
