import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Listen for a client joining a specific board "room"
        socket.on('join_board', (boardId) => {
            socket.join(boardId);
            console.log(`Client ${socket.id} joined board ${boardId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

// This function lets your controllers get the io instance
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};