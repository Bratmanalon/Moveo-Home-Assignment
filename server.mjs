import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const port = process.env.PORT || 4444;

const server = createServer(app);

const io = new Server(server);

app.use(express.static("public"));

const rooms = [
    {
        name: "async",
        initialCode: '// how does one spell async?',
        code: null, // will be set dynamically
        solution: 'async',
        sockets: new Set(),
    },
    {
        name: "functional",
        initialCode: '// will alon beat the newest member of the team?',
        code: null, // will be set dynamically
        solution: 'yes',
        sockets: new Set(),
    },
    {
        name: "loops",
        initialCode: '// loop five times.',
        code: null, // will be set dynamically
        solution: 'for (let i = 0; i < 5; i++)',
        sockets: new Set(),
    },
    {
        name: "classy",
        initialCode: '// write the word class',
        code: null, // will be set dynamically
        solution: 'class',
        sockets: new Set(),
    },
];

io.on("connection", (socket) => {

    socket.on("join-room", (roomName) => {
        const room = rooms.find((obj) => obj.name === roomName);
        if (!room) return;
        if (room.sockets.size === 0) {
            room.code = room.initialCode;
        }
        socket.join(roomName);
        room.sockets.add(socket);
        socket.emit("role", room.sockets.size === 1 ? "mentor" : "student");
        io.to(roomName).emit("visitors-count", room.sockets.size);
        socket.emit("code-changed", room.code);
        socket.emit("solution-is", room.solution);
    })

    socket.on("code-changed", (code) => {
        const room = rooms.find(obj => obj.sockets.has(socket));
        const roomName = room?.name;
        if (!roomName) return;
        room.code = code;
        socket.to(roomName).emit("code-changed", code);
    })

    socket.on("disconnect", () => {
        const room = rooms.find(obj => obj.sockets.has(socket));
        const roomName = room?.name;
        console.log("client left from", roomName);
        if (!room) return;
        socket.leave(roomName);
        room.sockets.delete(socket);
        io.to(roomName).emit("visitors-count", room.sockets.size);
    });
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
