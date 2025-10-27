import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { initSocket } from "./services/socketService.js";
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import cardRoutes from './routes/cardRoutes.js'

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// create an HTTP server from the Express app
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

app.use(cors({
    // origin: "https://kanban-project-lime.vercel.app/",
    origin: "*",
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...')
});

app.use ('/api/auth', authRoutes);
app.use ('/api/boards', boardRoutes);
app.use ('/api/cards', cardRoutes);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});