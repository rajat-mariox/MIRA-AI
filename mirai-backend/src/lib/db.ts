import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from './logger';

mongoose.set('strictQuery', true);

export async function connectDB(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info(`MongoDB connected (db: ${mongoose.connection.name})`);
  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export function mongoStatus(): 'connected' | 'disconnected' {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
