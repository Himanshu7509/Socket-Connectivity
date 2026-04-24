import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import connectDB from './config/db.js';
import { redisClient, connectRedis } from './config/redis.js';
import Message from './models/Message.js';

dotenv.config();
connectDB();
connectRedis();
const app = express();

const allowedOrigins = ['http://localhost:5000', 'http://localhost:5173', 'https://socket-connectivity.vercel.app'];
app.use( cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Create pub/sub clients for Redis adapter
const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Redis adapter for Socket.io (enables horizontal scaling)
Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter enabled for Socket.io');
  })
  .catch((err) => {
    console.error('Failed to connect Redis adapter:', err.message);
    console.log('Socket.io will work without Redis adapter');
  });

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle join room and send chat history
  socket.on('join_room', async (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);

    // Try to fetch from Redis cache first
    try {
      const cacheKey = `messages:${room}`;
      const cachedMessages = await redisClient.get(cacheKey);
      
      if (cachedMessages) {
        // Return cached messages
        const messages = JSON.parse(cachedMessages);
        socket.emit('load_messages', messages);
        console.log(`Loaded messages from Redis cache for room: ${room}`);
      } else {
        // Fetch from MongoDB if not in cache
        const previousMessages = await Message.find({ room }).sort({ timestamp: 1 }).limit(100);
        
        // Cache the messages in Redis for 1 hour
        await redisClient.set(cacheKey, JSON.stringify(previousMessages), {
          EX: 3600 // 1 hour expiration
        });
        
        socket.emit('load_messages', previousMessages);
        console.log(`Loaded messages from MongoDB and cached in Redis for room: ${room}`);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to MongoDB if Redis fails
      try {
        const previousMessages = await Message.find({ room }).sort({ timestamp: 1 }).limit(100);
        socket.emit('load_messages', previousMessages);
      } catch (dbError) {
        console.error('Error loading from MongoDB:', dbError);
      }
    }
  });

  // Handle chat messages
  socket.on('send_message', async (data) => {
    // Save message to database
    try {
      const newMessage = new Message({
        room: data.room,
        username: data.username,
        message: data.message,
        time: data.time
      });
      await newMessage.save();
      
      // Update Redis cache - append new message to cached messages
      try {
        const cacheKey = `messages:${data.room}`;
        const cachedMessages = await redisClient.get(cacheKey);
        
        if (cachedMessages) {
          const messages = JSON.parse(cachedMessages);
          messages.push(newMessage.toObject());
          
          // Keep only last 100 messages in cache
          if (messages.length > 100) {
            messages.shift();
          }
          
          await redisClient.set(cacheKey, JSON.stringify(messages), {
            EX: 3600 // 1 hour expiration
          });
        }
      } catch (cacheError) {
        console.error('Error updating Redis cache:', cacheError);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }

    // Broadcast to others in the room
    socket.to(data.room).emit('receive_message', data);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(data.room).emit('user_typing', data);
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.room).emit('user_stop_typing', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

export { io };

app.get('/', (req, res) => {
  res.send('api is running');
});

// API endpoint to get messages for a room
app.get('/api/messages/:room', async (req, res) => {
  try {
    // Try Redis cache first
    const cacheKey = `messages:${req.params.room}`;
    const cachedMessages = await redisClient.get(cacheKey);
    
    if (cachedMessages) {
      console.log(`Serving messages from Redis cache for room: ${req.params.room}`);
      return res.json(JSON.parse(cachedMessages));
    }
    
    // Fallback to MongoDB
    const messages = await Message.find({ room: req.params.room }).sort({ timestamp: 1 }).limit(100);
    
    // Cache the result
    await redisClient.set(cacheKey, JSON.stringify(messages), {
      EX: 3600 // 1 hour expiration
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});
