import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './adapters/http/app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = createApp();
const server = http.createServer(app);

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:8080,http://localhost:8081')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket] Nuevo cliente conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FFCore API escuchando en 0.0.0.0:${PORT}`);
  console.log(`Health: /api/v1/health`);
  console.log(`WebSocket Server listo`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV ?? 'development'}`);
});
