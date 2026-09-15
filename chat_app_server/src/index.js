import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import routes from './routes/routes.js';
import { setupSocket } from './socket/socket.js';
import { errorHandler } from './error/error_handling.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

// Socket Initialization
setupSocket(server);

// Database Connection & Server Start
const PORT = process.env.PORT || 5000 ;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatapp';
if(!process.env.MONGO_URI)console.log("MONGO_URI is not present....")

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
})
.catch((error) => {
    console.error('Database connection failed:', error);
});
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));