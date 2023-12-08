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
        code: '// create an async function.',
        sockets: new Set(),
    },
    {
        name: "functional",
        code: '',
        sockets: new Set(),
    },
    {
        name: "loops",
        code: '// loop five times.',
        sockets: new Set(),
    },
    {
        name: "classy",
        code: '',
        sockets: new Set(),
    },
];

io.on("connection", (socket) => {

    socket.on("join-room", (roomName) => {
        const room = rooms.find((obj) => obj.name === roomName);
        if (!room) return;
        socket.join(roomName);
        room.sockets.add(socket);
        socket.emit("role", room.sockets.size === 1 ? "mentor" : "student");
        io.to(roomName).emit("visitors-count", room.sockets.size);
        socket.emit("code-changed", room.code);
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
