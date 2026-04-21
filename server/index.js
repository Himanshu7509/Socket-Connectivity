import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import Message from './models/Message.js';

dotenv.config();
connectDB();
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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle join room and send chat history
  socket.on('join_room', async (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);

    // Fetch and send previous messages for this room
    try {
      const previousMessages = await Message.find({ room }).sort({ timestamp: 1 }).limit(100);
      socket.emit('load_messages', previousMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
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
    const messages = await Message.find({ room: req.params.room }).sort({ timestamp: 1 }).limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
});
