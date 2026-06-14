import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { FollowsModule } from '../follows/follows.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, StudentProfile, CompanyProfile, SchoolProfile]),
    forwardRef(() => FollowsModule),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
