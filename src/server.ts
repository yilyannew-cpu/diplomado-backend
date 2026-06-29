import 'dotenv/config';
import { createApp } from './adapters/http/app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FFCore API escuchando en 0.0.0.0:${PORT}`);
  console.log(`Health: /api/v1/health`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV ?? 'development'}`);
});
