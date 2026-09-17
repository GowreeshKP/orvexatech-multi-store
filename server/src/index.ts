// --- Orvexa Tech Local Dev Server ---
// This file is only used when running locally (npm run dev in server/).
// Vercel uses api/index.ts at the repo root instead.

import dotenv from 'dotenv'
import { connectMasterDatabase } from './config/db.js'
import { app } from './app.js'

dotenv.config()

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    try {
      await connectMasterDatabase()
      console.log('🚀 Connected to Master Database (orvexatech_master)')
    } catch (dbErr) {
      console.warn('⚠️ Master MongoDB connection deferred or offline. Starting Express server...')
    }

    app.listen(PORT, () => {
      console.log(`🌐 Orvexa Tech Backend running on http://localhost:${PORT}`)
      console.log(`📡 Health Check:   http://localhost:${PORT}/api/health`)
      console.log(`🛡️ Admin APIs:     http://localhost:${PORT}/api/admin/*`)
      console.log(`🏬 Store APIs:     http://localhost:${PORT}/api/stores/:tenantSlug/*`)
    })
  } catch (error) {
    console.error('Fatal Server Error:', error)
    process.exit(1)
  }
}

startServer()
