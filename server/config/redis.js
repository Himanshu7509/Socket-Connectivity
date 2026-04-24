import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Handle Redis connection events
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis Connection Error:', error.message);
    // Don't exit the process if Redis fails - app can still work with MongoDB
    console.log('Continuing without Redis caching...');
  }
};

export { redisClient, connectRedis };
