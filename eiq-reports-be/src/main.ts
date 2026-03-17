import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initDataLoader } from './common/data-loader';

async function bootstrap() {
  // Load report data (from MinIO URL if REPORT_URL is set, otherwise local files)
  await initDataLoader();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  console.log(`EngageIQ Reports API running on http://localhost:${port}`);
}
bootstrap();
