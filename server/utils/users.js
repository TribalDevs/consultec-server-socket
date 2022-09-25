import { isEmpty } from "./nativeMethods";
const { getCache, setCache, getKeys, delCache } = require("./redis");
async function joinUser({ id, username, socketId, location }) {
  const user = { id, username, socketId, location };
  await setCache(`user-${socketId}`, user);
  return user;
}
async function getUser(id) {
  const user = await getCache(`user-${id}`);
  return user;
}
async function getUsers() {
  const users = await getKeys("user-*");
  const usersData = [];
  if (users) {
    for (let i = 0; i < users.length; i++) {
      const user = await getCache(users[i]);
      usersData.push(user);
    }
  }
  return usersData;
}
async function deleteUser(id) {
  await delCache(`user-${id}`);
}

module.exports = {
  joinUser,
  getUser,
  getUsers,
  deleteUser,
};
