import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './adapters/http/app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = createApp();
const server = http.createServer(app);

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:8080')
  .split(',')
  .map((o) => o.trim());

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigins,
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
  console.log(`FFCore API escuchando en http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/v1/health`);
  console.log(`WebSocket Server listo`);
});
