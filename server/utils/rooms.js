import { isEmpty } from "./nativeMethods";
const { getCache, setCache, getKeys, delCache } = require("./redis");

async function createRoom(data) {
  await setCache(`room-${data.room}`, {
    room: data.room,
  });
  return await getCache(`room-${data.room}`);
}
async function getRoom(room) {
  const data = await getCache(`room-${room}`);
  return data;
}
async function getRooms() {
  const rooms = await getKeys("room-*");
  const roomsData = [];
  if (rooms) {
    for (let i = 0; i < rooms.length; i++) {
      const room = await getCache(rooms[i]);
      roomsData.push(room);
    }
  }
  return roomsData;
}
async function deleteRoom(room) {
  await delCache(`room-${room}`);
}

module.exports = {
  createRoom,
  getRoom,
  getRooms,
  deleteRoom,
};
