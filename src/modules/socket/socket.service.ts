// src/socket/socket.service.ts
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SocketService {
  private readonly clients: Map<string, Set<Socket>> = new Map();

  addClient(userId: string | number, socket: Socket): void {
    const key = String(userId);
    if (!this.clients.has(key)) {
      this.clients.set(key, new Set());
    }
    this.clients.get(key)!.add(socket);
  }

  removeClient(userId: string | number, socket: Socket): void {
    const key = String(userId);
    const set = this.clients.get(key);
    if (!set) return;

    set.delete(socket);
    if (set.size === 0) {
      this.clients.delete(key);
    }
  }

  isUserOnline(userId: string | number): boolean {
    const key = String(userId);
    const set = this.clients.get(key);
    return !!set && set.size > 0;
  }

  emitToUser(userId: string | number, event: string, data: any): void {
    const key = String(userId);
    const set = this.clients.get(key);
    if (!set) return;

    for (const client of set) {
      client.emit(event, data);
    }
  }

  isUserInRoom(userId: string | number, roomName: string): boolean {
    const key = String(userId);
    const set = this.clients.get(key);
    if (!set) return false;

    for (const client of set) {
      if (client.rooms.has(roomName)) return true;
    }
    return false;
  }

  getClients(userId: string | number): Socket[] {
    const key = String(userId);
    const set = this.clients.get(key);
    return set ? Array.from(set) : [];
  }

  sendNotificationToUser(userId: string | number, eventName: string, data: any) {
  const key = String(userId);
  const set = this.clients.get(key);
  if (!set) {
    console.error(`User ${userId} not found.`);
    return;
  }

  for (const client of set) {
    client.emit(eventName, data);
  }
}
}
