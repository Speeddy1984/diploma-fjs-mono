import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Socket, Server } from 'socket.io';
  import { Logger } from '@nestjs/common';
  
  @WebSocketGateway({
    namespace: '/support',
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })
  export class SupportGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private logger: Logger = new Logger('SupportGateway');
    private server!: Server;
  
    afterInit(server: Server) {
      this.server = server;
      this.logger.log('Инициализация gateway');
    }
  
    handleConnection(client: Socket) {
      this.logger.log(`Подключился клиент: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Отключился клиент: ${client.id}`);
    }
  
    @SubscribeMessage('subscribeToChat')
    handleSubscribe(
      @MessageBody() payload: { chatId: string },
      @ConnectedSocket() client: Socket,
    ) {
      client.join(payload.chatId);
      this.logger.log(`Client ${client.id} joined room ${payload.chatId}`);
    }
  
    broadcastNewMessage(chatId: string, message: any) {
      this.server.to(chatId).emit('newMessage', message);
      this.logger.log(`Broadcast newMessage to room ${chatId}`);
    }
  }
  