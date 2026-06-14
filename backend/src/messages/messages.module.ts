import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { Message } from './entities/message.entity'
import { User } from '../users/entities/user.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { MessagesService } from './messages.service'
import { MessagesController } from './messages.controller'
import { ChatGateway } from './chat.gateway'

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, StudentProfile, CompanyProfile, SchoolProfile]),
    JwtModule.register({}),
    ConfigModule,
  ],
  providers: [MessagesService, ChatGateway],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
