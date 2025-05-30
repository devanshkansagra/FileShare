import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: true });

const fileTransfers = {};
app.use(
  cors({
    origin: "*",
  }),
);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("upload-files", ({ files }) => {
    const fileId = uuidv4();
    fileTransfers[fileId] = { files, sender: socket.id };
    io.to(socket.id).emit("uploaded-files", fileId);
  });

  socket.on("join-file-room", (fileId) => {
    const { sender, files } = fileTransfers[fileId]; // Gives sender socketId;
    socket.emit("get-uploaded-file-metadata", { files });
    io.to(sender).emit("joined-file-room", socket.id);
  });

  socket.on("send-offer", ({ to, offer }) => {
    io.to(to).emit("recieve-offer", { from: socket.id, offer });
  });

  socket.on("send-answer", ({ to, answer }) => {
    io.to(to).emit("recieve-answer", { from: socket.id, answer });
  });
});

server.listen(process.env.VITE_SERVER_PORT, "0.0.0.0", () => {
  console.log("Server started");
});
