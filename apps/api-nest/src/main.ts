import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // DEV uniquement : autorise toutes origines (évite CORS pendant tes tests)
    app.enableCors({ origin: true, credentials: true });

    // écoute sur toutes les interfaces (pour y accéder via l'IP LAN)
    await app.listen(3001, '0.0.0.0');

    console.log('API on http://localhost:3001');
    console.log('DB_DRIVER =', process.env.DB_DRIVER );
}
bootstrap();
