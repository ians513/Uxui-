import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  poolPort: parseInt(process.env.DB_POOL_PORT ?? '6543', 10), // Supabase connection pooler
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  name:     process.env.DB_NAME     ?? 'red_talento_tp',
  ssl:      process.env.DB_SSL      === 'true' || process.env.DB_SSL === '1',
  usePooler: process.env.DB_USE_POOLER === 'true' || false, // Use Supabase connection pooler
}))
