import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { MessagesService, SendMessageDto } from './messages.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/public.decorator'

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Enviar un mensaje' })
  send(@CurrentUser() user: any, @Body() dto: SendMessageDto) {
    return this.messagesService.send(user.id, dto)
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Listar todas mis conversaciones' })
  getConversations(@CurrentUser() user: any) {
    return this.messagesService.getConversations(user.id)
  }

  @Get('thread/:partnerId')
  @ApiOperation({ summary: 'Ver mensajes con un usuario' })
  getThread(@CurrentUser() user: any, @Param('partnerId') partnerId: string) {
    return this.messagesService.getThread(user.id, partnerId)
  }
}
