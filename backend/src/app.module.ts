import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { StudentsModule } from './students/students.module'
import { CompaniesModule } from './companies/companies.module'
import { SchoolsModule } from './schools/schools.module'
import { SkillsModule } from './skills/skills.module'
import { OpportunitiesModule } from './opportunities/opportunities.module'
import { ApplicationsModule } from './applications/applications.module'
import { MessagesModule } from './messages/messages.module'
import { PublicationsModule } from './publications/publications.module'
import { MediaModule } from './media/media.module'
import { NotificationsModule } from './notifications/notifications.module'
import { FollowsModule } from './follows/follows.module'
import { HealthModule } from './health/health.module'
import databaseConfig from './config/database.config'
import appConfig from './config/app.config'

@Module({
  imports: [
    // ── Config ─────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
      cache: false,
      expandVariables: true,
    }),

    // ── Database ────────────────────────────────────────────────────────────
     TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const usePooler = config.get<boolean>('database.usePooler');
        const host = config.get<string>('database.host');
        const username = config.get<string>('database.username');
        const password = config.get<string>('database.password');
        const database = config.get<string>('database.name');
        const sslEnabled = config.get<boolean>('database.ssl');
        const port = usePooler
          ? config.get<number>('database.poolPort')
          : config.get<number>('database.port');

        console.log('📊 [DATABASE CONFIG]');
        console.log(`  Host: ${host}`);
        console.log(`  Port: ${port}`);
        console.log(`  Database: ${database}`);
        console.log(`  Username: ${username}`);
        console.log(`  SSL: ${sslEnabled}`);

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize: config.get('app.nodeEnv') === 'development',
          logging: config.get('app.nodeEnv') === 'development',
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          extra: {
            max: 10,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            statement_timeout: 30000,
          },
          keepConnectionAlive: true,
          retryAttempts: 5,
          retryDelay: 3000,
        };
      },
    }),

    TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT!,10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,

        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      
        synchronize: false,
        autoLoadEntities: true
}),

    // ── Feature modules ─────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    StudentsModule,
    CompaniesModule,
    SchoolsModule,
    SkillsModule,
    OpportunitiesModule,
    ApplicationsModule,
    MessagesModule,
    PublicationsModule,
    MediaModule,
    NotificationsModule,
    FollowsModule,
    HealthModule,
  ],
})
export class AppModule {}
