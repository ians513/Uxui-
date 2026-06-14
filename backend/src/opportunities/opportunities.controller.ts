import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { OpportunitiesService } from './opportunities.service'
import { CreateOpportunityDto, UpdateOpportunityDto, OpportunityQueryDto } from './dto/opportunity.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/public.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('Opportunities')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  /** Public list — no auth required */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar oportunidades activas' })
  findAll(@Query() query: OpportunityQueryDto) {
    return this.opportunitiesService.findAll(query)
  }

  /** Student view — includes match score */
  @Get('for-me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Oportunidades con match score para el estudiante autenticado' })
  findForMe(@CurrentUser() user: any, @Query() query: OpportunityQueryDto) {
    return this.opportunitiesService.findWithMatchScore(user.id, query)
  }

  /** Company's own offers */
  @Get('my-offers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPRESA)
  @ApiOperation({ summary: 'Mis ofertas publicadas' })
  myOffers(@CurrentUser() user: any) {
    return this.opportunitiesService.findByCompany(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de oportunidad' })
  findOne(@Param('id') id: string) {
    return this.opportunitiesService.findById(id)
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPRESA)
  @ApiOperation({ summary: 'Publicar nueva oportunidad' })
  create(@CurrentUser() user: any, @Body() dto: CreateOpportunityDto) {
    return this.opportunitiesService.create(user.id, dto)
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPRESA)
  @ApiOperation({ summary: 'Actualizar oportunidad' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.opportunitiesService.update(user.id, id, dto)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPRESA)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar oportunidad' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.opportunitiesService.remove(user.id, id)
  }

  /** Toggle save/bookmark (Student only) */
  @Post(':id/save')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Guardar / dejar de guardar oportunidad' })
  toggleSave(@CurrentUser() user: any, @Param('id') id: string) {
    return this.opportunitiesService.toggleSave(user.id, id)
  }

  /** List saved opportunities (Student only) */
  @Get('saved/mine')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Oportunidades guardadas por el estudiante' })
  getSaved(@CurrentUser() user: any) {
    return this.opportunitiesService.getSaved(user.id)
  }
}
