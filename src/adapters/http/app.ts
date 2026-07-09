import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes';
import { usersRouter } from './routes/usersRoutes';
import { metricsRouter } from './routes/metricsRoutes';
import { systemRouter } from './routes/systemRoutes';
import { productsRouter } from './routes/productsRoutes';
import { ordersRouter } from './routes/ordersRoutes';
import { restaurantsRouter } from './routes/restaurantsRoutes';
import { couriersRouter } from './routes/couriersRoutes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:8080,http://localhost:8081')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        // Permite previews y produccion en Vercel
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    })
  );

  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      service: 'ffcore-api',
      version: '1.0.0',
      status: 'ok',
      health: '/api/v1/health',
      docs: 'FFCore API v1 - Auth, Registros, Operaciones, Productos y Órdenes',
    });
  });

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
  app.use('/api/v1/metrics', metricsRouter);
  app.use('/api/v1/system', systemRouter);
  app.use('/api/v1/couriers', couriersRouter);
  app.use('/api/v1/restaurants', restaurantsRouter);
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/orders', ordersRouter);

  app.use(errorHandler);

  return app;
}
