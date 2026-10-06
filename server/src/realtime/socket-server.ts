import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { TaskChangeEvent } from './event-bus.js';

export function createSocketServer(server: HttpServer, allowedOrigin: string) {
  const io = new Server(server, { cors: { origin: allowedOrigin } });
  return {
    broadcast(event: TaskChangeEvent) {
      io.emit('task:changed', event);
    },
    close() {
      return io.close();
    },
  };
}
