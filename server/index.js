import express from "express";
import http from "http";
import cors from "cors";
import { REDIS } from "../config/config";
import { createClient } from "redis";
import {
  joinUser,
  setUserStatus,
  deleteUser,
  checkUserStatus,
  requestUsersStatus
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
    deleteUser(socket.id);
  });
  // trigger when user join
  socket.on("join", async (data) => {
    joinUser({
      ...data,
      socketId: socket.id,
    }).then(async (user) => {
      socket.emit("successJoin", user);
    });
  });
  socket.on("startNewConversation", ({ initiator, receiver }) => {});
  socket.on("checkUserStatus", async (id) => {
    checkUserStatus(id).then((data) => {
      socket.emit("sendUserStatus", data);
    });
  });
  socket.on("sendMessage", async (data) => {
    io.to(data.receiver.socketId).emit("receiveMessage", {
      ...data,
      senderSocketId: socket.id,
    });
  });
  socket.on("requestUsersStatus", async (data)=> {
    requestUsersStatus(data).then((users) => {
      socket.emit("sendUsersStatus", users);
    });
  })
});
export default server;
