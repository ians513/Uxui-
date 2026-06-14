import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Application } from './entities/application.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { Opportunity } from '../opportunities/entities/opportunity.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { ApplicationsService } from './applications.service'
import { ApplicationsController } from './applications.controller'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, StudentProfile, Opportunity, CompanyProfile]),
    NotificationsModule,
  ],
  providers: [ApplicationsService],
  controllers: [ApplicationsController],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
