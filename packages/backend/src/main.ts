import { NestFactory } from '@nestjs/core';
import { rockReviver } from '@rock-solid/shared';
import { AppModule } from './app.module.js';
import bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    bodyParser: false,
  });
  app.use(
    bodyParser.json({
      reviver: rockReviver,
    }),
  );
  app.setGlobalPrefix('api', { exclude: ['/auth/login', '/auth/callback'] });
  await app.listen(process.env['PORT'] ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
