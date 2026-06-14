import { Controller, Get } from '@nestjs/common'
import { DataSource } from 'typeorm'

@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }

  @Get('db')
  async checkDatabase() {
    try {
      const result = await this.dataSource.query('SELECT NOW()')
      return {
        status: 'connected',
        database: {
          connected: true,
          timestamp: result[0]?.now,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          environment: process.env.NODE_ENV,
        },
      }
    } catch (error) {
      return {
        status: 'error',
        database: {
          connected: false,
          error: (error as any).message,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
        },
      }
    }
  }
}
