const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

function createRoom(code, hostId) {
  rooms[code] = {
    host: hostId,
    players: [],
    spectators: []
  };
}

io.on("connection", (socket) => {

  socket.on("createRoom", (code) => {
    createRoom(code, socket.id);
    socket.join(code);
    rooms[code].players.push(socket.id);
    socket.emit("roomCreated", code);
  });

  socket.on("joinRoom", ({ code, type }) => {
    if (!rooms[code]) {
      socket.emit("errorMessage", "部屋が存在しません");
      return;
    }

    socket.join(code);

    if (type === "player") {
      rooms[code].players.push(socket.id);
    } else {
      rooms[code].spectators.push(socket.id);
    }

    io.to(code).emit("updateRoom", rooms[code]);
  });

  socket.on("deleteRoom", (code) => {
    if (!rooms[code]) return;
    if (rooms[code].host !== socket.id) return;

    io.to(code).emit("roomDeleted");
    delete rooms[code];
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {
      rooms[code].players = rooms[code].players.filter(id => id !== socket.id);
      rooms[code].spectators = rooms[code].spectators.filter(id => id !== socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
