import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    socket = io(url, { withCredentials: true });
  }
  return socket;
}

export function joinGuild(guildId) {
  getSocket().emit('join:guild', guildId);
}
