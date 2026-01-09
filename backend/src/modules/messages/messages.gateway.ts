import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('chat:join')
  handleJoinChat(
    @MessageBody() data: { listingId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `listing:${data.listingId}`;
    client.join(room);
    return { event: 'chat:joined', data: { room } };
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: CreateMessageDto & { senderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.create(data.senderId, {
      listing_id: data.listing_id,
      receiver_id: data.receiver_id,
      content: data.content,
    });

    // Broadcast to room
    const room = `listing:${data.listing_id}`;
    this.server.to(room).emit('message:new', message);

    return { event: 'message:sent', data: message };
  }

  @SubscribeMessage('message:typing')
  handleTyping(
    @MessageBody() data: { listingId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `listing:${data.listingId}`;
    client.to(room).emit('message:typing', { userId: data.userId });
  }
}
