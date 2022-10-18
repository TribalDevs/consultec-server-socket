import express from "express";
import http from "http";
import cors from "cors";
import { REDIS } from "../config/config";
import { createClient } from "redis";

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
  });
  // trigger when user join
  socket.on("join", async (data) => {
    console.log("join", data);
  });
});
export default server;
