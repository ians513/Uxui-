import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { MessagesService, SendMessageDto } from '../messages/messages.service'

interface AuthenticatedSocket extends Socket {
  userId?: string
}

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especificar el origen del frontend
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('ChatGateway')

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagesService: MessagesService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized')
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token
      if (!token) {
        client.disconnect()
        return
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      })

      client.userId = payload.sub
      client.join(`user_${client.userId}`)
      this.logger.log(`Client connected: ${client.userId}`)
    } catch (error) {
      this.logger.error('Authentication failed', error?.message ?? error)
      client.disconnect()
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.userId}`)
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { error: 'Not authenticated' }
      }

      // Guardar el mensaje en la base de datos
      const message = await this.messagesService.send(client.userId, data)

      // Obtener información del remitente para el broadcast
      const senderInfo = await this.messagesService.resolveParticipant(client.userId)

      // Enviar el mensaje al receptor específico
      const messageData = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        createdAt: message.createdAt,
        sender: senderInfo,
      }

      // Emitir al receptor
      this.server.to(`user_${data.receiverId}`).emit('newMessage', messageData)

      // También emitir al remitente para confirmar
      this.server.to(`user_${client.userId}`).emit('messageSent', messageData)

      return { success: true, message: messageData }
    } catch (error) {
      this.logger.error('Error sending message', error)
      return { error: 'Failed to send message' }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId === data.userId) {
      client.join(`user_${data.userId}`)
      this.logger.log(`User ${data.userId} joined their room`)
      return { success: true }
    }
    return { error: 'Unauthorized' }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId === data.userId) {
      client.leave(`user_${data.userId}`)
      this.logger.log(`User ${data.userId} left their room`)
      return { success: true }
    }
    return { error: 'Unauthorized' }
  }
}