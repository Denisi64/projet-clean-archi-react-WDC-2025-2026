import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

console.log('📝 Script started');

process.on('exit', (code) => {
    console.log(`⚠️  Process exiting with code: ${code}`);
});

process.on('beforeExit', (code) => {
    console.log(`⚠️  Process about to exit with code: ${code}`);
});

async function bootstrap() {
    console.log('🚀 Starting bootstrap...');

    try {
        console.log('🔨 Creating NestFactory...');
        const app = await NestFactory.create(AppModule);
        console.log('✅ App created successfully');

        console.log('🔓 Enabling CORS...');
        app.enableCors({
            origin: true,
            credentials: true,
        });
        console.log('✅ CORS enabled');

        console.log('🎧 About to call app.listen()...');
        await app.listen(3001, '0.0.0.0');
        console.log('🚀 SUCCESS! Server running on http://localhost:3001');
        console.log('🔌 WebSocket available on ws://localhost:3001/chat');

        // Keep process alive
        setInterval(() => {
            console.log('💓 Server alive at', new Date().toISOString());
        }, 5000);
    } catch (error) {
        console.error('❌ Bootstrap error:', error);
        throw error;
    }
}

console.log('🎬 Calling bootstrap()...');
bootstrap()
    .then(() => {
        console.log('✅ Bootstrap promise resolved');
    })
    .catch((error) => {
        console.error('💥 Bootstrap promise rejected:', error);
        process.exit(1);
    });

console.log('📝 Script end reached');
