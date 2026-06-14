import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { CompaniesService, UpdateCompanyDto } from './companies.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/public.decorator'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('Companies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPRESA)
  @ApiOperation({ summary: 'Ver mi perfil de empresa' })
  getMyProfile(@CurrentUser() user: any) {
    return this.companiesService.findByUserId(user.id)
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPRESA)
  @ApiOperation({ summary: 'Actualizar mi perfil de empresa' })
  update(@CurrentUser() user: any, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(user.id, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver perfil público de empresa' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findById(id)
  }
}
