import 'dotenv/config' // <-- Важно! Строго первой строкой
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Используем process.env вместо env(). Призма прочитает её из dotenv.
    url: process.env.DATABASE_URL!, 
  },
})
