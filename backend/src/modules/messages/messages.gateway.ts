import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  WsException,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JoinChatDto } from './dto/join-chat.dto';
import { TypingDto } from './dto/typing.dto';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from '../../common/interfaces/request-with-user.interface';

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = process.env.FRONTEND_URL || 'http://localhost:3001';
      if (!origin || origin === allowed) {
        callback(null, true);
      } else {
        callback(new Error('WebSocket connection not allowed by CORS'), false);
      }
    },
    credentials: true,
  },
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const raw =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace(
          'Bearer ',
          '',
        );

      if (!raw) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(raw, {
        secret: this.configService.get<string>('security.jwt.secret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        select: ['id', 'is_active'],
      });

      if (!user || !user.is_active) {
        client.disconnect(true);
        return;
      }

      client.data.user = payload;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('chat:join')
  handleJoinChat(
    @MessageBody() data: JoinChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `listing:${data.listingId}`;
    client.join(room);
    return { event: 'chat:joined', data: { room } };
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user as JwtPayload | undefined;
      if (!user) {
        throw new WsException('Not authenticated');
      }
      const senderId = user.sub;
      const message = await this.messagesService.create(senderId, data);
      const room = `listing:${data.listing_id}`;
      this.server.to(room).emit('message:new', message);
      return { event: 'message:sent', data: message };
    } catch (error) {
      if (error instanceof WsException) throw error;
      throw new WsException(
        (error as Error).message || 'Failed to send message',
      );
    }
  }

  @SubscribeMessage('message:typing')
  handleTyping(
    @MessageBody() data: TypingDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as JwtPayload | undefined;
    if (!user) return;
    const userId = user.sub;
    const room = `listing:${data.listingId}`;
    client.to(room).emit('message:typing', { userId });
  }
}
