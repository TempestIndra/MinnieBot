const { EventEmitter } = require('events');

class RealtimeEmitter extends EventEmitter {
  attach(io) {
    this.io = io;
    this.on('xp:update', (data) => io.to(`guild:${data.guildId}`).emit('xp:update', data));
    this.on('level:up', (data) => io.to(`guild:${data.guildId}`).emit('level:up', data));
    this.on('leaderboard:update', (data) => io.to(`guild:${data.guildId}`).emit('leaderboard:update', data));
    this.on('voice:activity', (data) => io.to(`guild:${data.guildId}`).emit('voice:activity', data));
    this.on('notification', (data) => io.to(`guild:${data.guildId}`).emit('notification', data));
  }

  joinGuild(socket, guildId) {
    socket.join(`guild:${guildId}`);
  }
}

module.exports = new RealtimeEmitter();
