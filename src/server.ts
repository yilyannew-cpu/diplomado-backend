import 'dotenv/config';
import { createApp } from './adapters/http/app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = createApp();

app.listen(PORT, () => {
  console.log(`FFCore API escuchando en http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/v1/health`);
});
