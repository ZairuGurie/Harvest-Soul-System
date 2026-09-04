import { ensureBibleSchema } from './setup-bible-db.mjs'

ensureBibleSchema().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
