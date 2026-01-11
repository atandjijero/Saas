import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
  },
})
export class AppGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-tenant')
  handleJoinTenant(@MessageBody() tenantId: string, @ConnectedSocket() client: Socket) {
    client.join(tenantId);
  }

  // Method to emit stock updates
  emitStockUpdate(tenantId: string, productId: string, newStock: number) {
    this.server.to(tenantId).emit('stock-update', { productId, newStock });
  }
}