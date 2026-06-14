import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Opportunity } from './entities/opportunity.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { PortfolioEvidence } from '../students/entities/portfolio-evidence.entity'
import { OpportunitiesService } from './opportunities.service'
import { OpportunitiesController } from './opportunities.controller'
import { MatchModule } from '../match/match.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Opportunity, CompanyProfile, StudentProfile, PortfolioEvidence]),
    MatchModule,
  ],
  providers: [OpportunitiesService],
  controllers: [OpportunitiesController],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
