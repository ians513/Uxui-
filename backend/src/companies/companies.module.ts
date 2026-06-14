import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CompanyProfile } from './entities/company-profile.entity'
import { CompaniesService } from './companies.service'
import { CompaniesController } from './companies.controller'

@Module({
  imports: [TypeOrmModule.forFeature([CompanyProfile])],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
