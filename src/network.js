import Peer from 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/+esm';

export class SurvivalNetwork {
  constructor({ PeerClass = Peer, playerName = 'Player' } = {}) {
    this.PeerClass = PeerClass;
    this.playerName = playerName;
    this.peer = null;
    this.isHost = false;
    this.roomId = null;
    this.hostConnection = null;
    this.connections = new Map();
    this.blacklist = new Set();
    this.totalGameTime = 0;
    this.syncAccumulator = 0;
    this.syncIntervalMs = 2000;

    this.callbacks = {
      onChat: () => {},
      onRemoteJoin: () => {},
      onRemoteLeave: () => {},
      onTimeSync: () => {},
      onRemoteHit: () => {},
      onStatus: () => {}
    };
  }

  setCallbacks(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  createRoom(roomId) {
    this.disconnect();
    this.isHost = true;
    this.roomId = roomId;
    this.peer = new this.PeerClass(`survival-${roomId}`, { debug: 0 });

    this.peer.on('open', () => {
      this.callbacks.onStatus({ type: 'host-open', roomId, peerId: this.peer.id });
    });

    this.peer.on('connection', (conn) => {
      if (this.blacklist.has(conn.peer)) {
        conn.close();
        return;
      }

      this.connections.set(conn.peer, conn);
      conn.on('open', () => {
        conn.send({ type: 'welcome', totalGameTime: this.totalGameTime, peerId: this.peer.id });
        this.callbacks.onRemoteJoin(conn.peer, 'Player');
      });

      conn.on('data', (message) => {
        if (!message || typeof message !== 'object') return;

        if (message.type === 'hello') {
          this.callbacks.onRemoteJoin(conn.peer, message.playerName || 'Player');
          this.broadcast({ type: 'remote-join', peerId: conn.peer, playerName: message.playerName || 'Player' }, conn.peer);
          return;
        }

        if (message.type === 'chat') {
          this.callbacks.onChat(message.playerName || 'Player', message.message || '');
          this.broadcast({ type: 'chat', peerId: conn.peer, playerName: message.playerName || 'Player', message: message.message || '' }, conn.peer);
          return;
        }

        if (message.type === 'admin') {
          this.handleAdminCommand(message.command);
          return;
        }

        if (message.type === 'hit') {
          this.callbacks.onRemoteHit(message);
          this.broadcast({ type: 'hit', ...message }, conn.peer);
          return;
        }
      });

      conn.on('close', () => {
        this.connections.delete(conn.peer);
        this.callbacks.onRemoteLeave(conn.peer);
      });
    });

    this.peer.on('error', (err) => {
      this.callbacks.onStatus({ type: 'error', message: err?.type || 'peer error' });
    });
  }

  joinRoom(roomId, playerName = 'Player') {
    this.disconnect();
    this.isHost = false;
    this.roomId = roomId;
    this.playerName = playerName;

    this.peer = new this.PeerClass({ debug: 0 });
    this.peer.on('open', () => {
      const conn = this.peer.connect(`survival-${roomId}`, { reliable: true });
      this.hostConnection = conn;

      conn.on('open', () => {
        conn.send({ type: 'hello', playerName: this.playerName });
        this.callbacks.onStatus({ type: 'connected', roomId, peerId: this.peer.id });
      });

      conn.on('data', (message) => {
        if (!message || typeof message !== 'object') return;

        if (message.type === 'welcome') {
          this.totalGameTime = Number(message.totalGameTime) || 0;
          this.callbacks.onTimeSync(this.totalGameTime);
          return;
        }

        if (message.type === 'time-sync') {
          this.totalGameTime = Number(message.totalGameTime) || this.totalGameTime;
          this.callbacks.onTimeSync(this.totalGameTime);
          return;
        }

        if (message.type === 'chat') {
          this.callbacks.onChat(message.playerName || 'Player', message.message || '');
          return;
        }

        if (message.type === 'remote-join') {
          this.callbacks.onRemoteJoin(message.peerId, message.playerName || 'Player');
          return;
        }

        if (message.type === 'hit') {
          this.callbacks.onRemoteHit(message);
        }
      });

      conn.on('close', () => {
        this.callbacks.onStatus({ type: 'disconnected', roomId });
      });
    });

    this.peer.on('error', (err) => {
      this.callbacks.onStatus({ type: 'error', message: err?.type || 'peer error' });
    });
  }

  disconnect() {
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.hostConnection = null;
    this.isHost = false;
    this.connections.clear();
    this.roomId = null;
  }

  broadcast(data, excludePeerId = null) {
    if (!this.isHost) return;
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId === excludePeerId) continue;
      if (conn && conn.open) {
        try { conn.send(data); } catch (e) {}
      }
    }
  }

  sendChat(message) {
    const payload = { type: 'chat', playerName: this.playerName, message: String(message).slice(0, 200) };
    if (this.isHost) {
      this.callbacks.onChat(this.playerName, payload.message);
      this.broadcast(payload);
      return;
    }
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(payload);
    }
  }

  sendAdminCommand(command) {
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({ type: 'admin', command });
    }
  }

  emitHit(data) {
    const payload = { type: 'hit', ...data };
    if (this.isHost) {
      this.broadcast(payload);
      this.callbacks.onRemoteHit(payload);
      return;
    }
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(payload);
    }
  }

  update(deltaMs) {
    if (!this.peer || !this.isHost) return;
    this.totalGameTime += deltaMs;
    this.syncAccumulator += deltaMs;
    if (this.syncAccumulator >= this.syncIntervalMs) {
      this.syncAccumulator = 0;
      const payload = { type: 'time-sync', totalGameTime: this.totalGameTime };
      this.broadcast(payload);
      this.callbacks.onTimeSync(this.totalGameTime);
    }
  }

  handleAdminCommand(command) {
    if (!command || typeof command !== 'string') return;
    if (!command.startsWith('/')) return;

    const kickMatch = command.match(/^\/kick\s+([A-Za-z0-9-]+)/);
    if (kickMatch) {
      this.kickPeer(kickMatch[1]);
      return;
    }

    const banMatch = command.match(/^\/ban\s+([A-Za-z0-9-]+)/);
    if (banMatch) {
      this.banPeer(banMatch[1]);
    }
  }

  kickPeer(peerId) {
    if (!this.isHost) return false;
    const conn = this.connections.get(peerId);
    if (!conn) return false;
    try { conn.close(); } catch (e) {}
    this.connections.delete(peerId);
    this.callbacks.onRemoteLeave(peerId);
    this.broadcast({ type: 'chat', playerName: 'System', message: `Player ${peerId} was kicked.` });
    return true;
  }

  banPeer(peerId) {
    if (!this.isHost) return false;
    this.blacklist.add(peerId);
    const conn = this.connections.get(peerId);
    if (conn) {
      try { conn.close(); } catch (e) {}
      this.connections.delete(peerId);
      this.callbacks.onRemoteLeave(peerId);
    }
    this.broadcast({ type: 'chat', playerName: 'System', message: `Player ${peerId} was banned.` });
    return true;
  }
}
