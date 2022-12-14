import cors from "cors";
import express from "express";
import http from "http";
import { createClient } from "redis";
import { REDIS } from "../config/config";
import {
  checkUserStatus,
  deleteUser,
  joinUser,
  requestUsersStatus,
  setUserStatus
} from "./utils/users";

const app = express();
const server = http.createServer(app);
const url = REDIS.URL;
export const client = createClient({ url: url });
client.on("connect", () => console.log("Connected to Redis!"));
client.on("error", (err) => console.log("Redis Client Error", err));
client.connect();

export const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    transports: ["websocket", "polling"],
  },
  "force new connection": true,
  timeout: 10000,
  allowEIO3: true,
});
app.use(cors());
app.use(
  express.json({
    limit: "50mb",
  })
);
io.on("connection", (socket) => {
  // connection log
  console.log("New client connected to consultec server", socket.id);
  // disconnect log
  socket.on("disconnect", () => {
    console.log("Client disconnected from consultec server", socket.id);
    deleteUser(socket.id).then(async (id) => {
      if (id) {
        io.emit("userHasDisconnected", id);
      }
    });
  });
  // trigger when user join
  socket.on("join", async (data) => {
    if (data) {
      joinUser({
        ...data,
        socketId: socket.id,
      }).then(async (user) => {
        socket.emit("successJoin", user);
        // broadcast to all users
        socket.broadcast.emit("userHasConnected", user);
      });
    }
  });
  socket.on("startNewConversation", ({ initiator, receiver }) => {});
  socket.on("checkUserStatus", async (id) => {
    checkUserStatus(id).then((data) => {
      socket.emit("sendUserStatus", data);
    });
  });
  socket.on("sendMessage", async (data) => {
    console.log("sendMessage", data);
    io.to(data.receiver.socketId).emit("receiveMessage", {
      ...data,
      senderSocketId: socket.id,
    });
  });
  socket.on("requestUsersStatus", async (data) => {
    requestUsersStatus(data).then((users) => {
      socket.emit("sendUsersStatus", users);
    });
  });
  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });
  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });
  socket.on("rejectCall", (data) => {
    io.to(data.to).emit("rejectedCall");
  });
  socket.on("endCall", (data) => {
    console.log("endCall", data);
    io.to(data.to).emit("endedCall");
  });
});
export default server;
