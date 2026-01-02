// src/socket/socket.gateway.ts
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';
import { ReportingModuleService } from '../reporting_module/reporting_module.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly reportingModuleService: ReportingModuleService,
    private readonly socketService: SocketService,
  ) { }

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.socketService.addClient(userId, client);
      console.log(`User ${userId} connected.`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.socketService.removeClient(userId, client);
      console.log(`User ${userId} disconnected.`);
    }
  }


  @SubscribeMessage('addUser')
  handleAddUser(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.socketService.addClient(userId, client);
      console.log(`User ${userId} added.`);
    } else {
      console.error('Invalid socket: missing userId in query');
    }
  }

  private getUserIdFromSocket(socket: Socket): string | undefined {
    return socket.handshake.query?.userId as string;
  }

  // ---------- JOIN CHAT ROOM (NEW) ----------
  @SubscribeMessage('joinChatRoom')
  handleJoinChatRoom(
    @MessageBody() data: { roomName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomName } = data;
    if (!roomName) return;

    client.join(roomName);
    console.log(`Socket ${client.id} joined room ${roomName}`);
  }

  emitParticipantsUpdate(roomName: string, data: { participants: any[] }) {
    console.log(`Emitting chatParticipantsUpdate with ${data.participants.length} participants for room: ${roomName}`);
    this.server.to(roomName).emit('chatParticipantsUpdate', data);
  }

  // ---------- SEND CHAT MESSAGE (NEW) ----------
  @SubscribeMessage('chatSendMessage')
  async handleChatSendMessage(
    @MessageBody() msgData: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log("inn-----")
    const userId = this.getUserIdFromSocket(client);
    if (!userId) {
      console.error('Unauthenticated socket tried to send message');
      return;
    }

    
    // enforce sender from socket
    msgData.senderId = Number(userId);
    const senderName = msgData.senderName;
    if (msgData.senderName) {
      delete msgData.senderName
    }
    // Save to DB
    const saved = await this.reportingModuleService.saveChatsForReportingQueAns(msgData);
    const roomName = `chat_${saved.questionId}_${saved.financialYearId}_${saved.sourceId}_${saved.subLocationId ?? "NULL"}_${saved.fromDate || "NULL"}_${saved.toDate || "NULL"}`;

    const payload = {
      id: saved.id,
      questionId: saved.questionId,
      financialYearId: saved.financialYearId,
      sourceId: saved.sourceId,
      subLocationId: saved.subLocationId,
      fromDate: saved.fromDate,
      toDate: saved.toDate,
      content: saved.content,
      senderId: saved.senderId,
      senderName: senderName,
      mentions: saved.mentions,
      createdAt: saved.createdAt,
    };

    this.server.to(roomName).emit('chatNewMessage', payload);
  }

  // --- PUBLIC API FOR CONTROLLERS (OPTIONAL) ---
  emitChatMessage(roomName: string, payload: any) {
    this.server.to(roomName).emit('chatNewMessage', payload);
  }

  @SubscribeMessage('leaveChatRoom')
  handleLeaveChatRoom(
    @MessageBody() data: { roomName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomName } = data;
    if (!roomName) return;

    client.leave(roomName);
    console.log(`Socket ${client.id} left room ${roomName}`);
  }

}
