import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes';
import { usersRouter } from './routes/usersRoutes';
import { productsRouter } from './routes/productsRoutes';
import { ordersRouter } from './routes/ordersRoutes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:8080')
    .split(',')
    .map((o) => o.trim());

  app.use(
    cors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    })
  );

  app.use(express.json());

  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'ffcore-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/orders', ordersRouter);

  app.use(errorHandler);

  return app;
}
