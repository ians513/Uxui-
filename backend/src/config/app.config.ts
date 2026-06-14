import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
  nodeEnv:        process.env.NODE_ENV       ?? 'development',
  port:           parseInt(process.env.PORT  ?? '3001', 10),
  frontendUrl:    process.env.FRONTEND_URL   ?? 'http://localhost:3000',
  jwtSecret:      process.env.JWT_SECRET     ?? 'red-talento-dev-secret-change-in-production',
  jwtExpiresIn:   process.env.JWT_EXPIRES_IN ?? '15m',
  refreshSecret:  process.env.JWT_REFRESH_SECRET  ?? 'red-talento-refresh-dev-secret',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
}))
