import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ApplicationsService } from './applications.service'
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/public.decorator'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('Applications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Postular a una oportunidad' })
  apply(@CurrentUser() user: any, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(user.id, dto)
  }

  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Ver mis postulaciones' })
  myApplications(@CurrentUser() user: any) {
    return this.applicationsService.findMyApplications(user.id)
  }

  @Get('applicants')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPRESA)
  @ApiOperation({ summary: 'Ver postulantes a mis ofertas' })
  getApplicants(@CurrentUser() user: any, @Query('opportunityId') opportunityId?: string) {
    return this.applicationsService.findApplicantsForCompany(user.id, opportunityId)
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPRESA)
  @ApiOperation({ summary: 'Actualizar estado de una postulación' })
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(user.id, id, dto)
  }

  @Patch(':id/hide-from-profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ocultar experiencia del perfil' })
  hideFromProfile(@CurrentUser() user: any, @Param('id') id: string) {
    return this.applicationsService.hideFromProfile(user.id, id)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirar postulación' })
  withdraw(@CurrentUser() user: any, @Param('id') id: string) {
    return this.applicationsService.withdraw(user.id, id)
  }
}
