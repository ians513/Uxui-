import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/public.decorator'

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar usuarios (estudiantes, empresas, colegios)' })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda' })
  @ApiQuery({ name: 'limit', required: false })
  search(@Query('q') q = '', @Query('limit') limit = 20) {
    if (!q.trim()) return []
    return this.usersService.search(q.trim(), +limit)
  }

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Perfil público de cualquier usuario con contadores y estado de seguimiento' })
  getPublicProfile(@Param('userId') userId: string, @CurrentUser() viewer: any) {
    return this.usersService.getPublicProfile(userId, viewer?.id)
  }
}
