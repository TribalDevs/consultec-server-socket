import { isEmpty } from "./nativeMethods";
const { getCache, setCache, getKeys, delCache } = require("./redis");
async function joinUser({ id, username, socketId, ...rest }) {
  const user = {
    ...rest,
    id,
    username,
    socketId,
    status: "online",
  };
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
async function setUserStatus({ id, status }) {
  const user = await getUser(id);
  if (user) {
    user.status = status;
    await setCache(`user-${id}`, user);
  }
}
async function deleteUser(id) {
  const users = await getKeys("user-*");
  if (users) {
    let userId = "";
    // check if there is a user with the same socket id
    for (let i = 0; i < users.length; i++) {
      const user = await getCache(users[i]);
      if (user) {
        if (user.socketId === id) {
          await delCache(users[i]);
          userId = user.id;
          break;
        }
      }
    }
    // check if there is a user with the same id
    for (let i = 0; i < users.length; i++) {
      const user = await getCache(users[i]);
      if (user) {
        if (user.id === userId) {
          await delCache(users[i]);
        }
      }
    }
    return userId;
  }
}
async function checkUserStatus(id) {
  // get all users
  const users = await getKeys("user-*");
  let userStatus = "offline";
  let userSocketId = "";
  if (users) {
    for (let i = 0; i < users.length; i++) {
      const user = await getCache(users[i]);
      if (user.id === id) {
        userStatus = user.status;
        userSocketId = user.socketId;
        break;
      }
    }
  }
  return {
    status: userStatus,
    socketId: userSocketId,
  };
}
async function requestUsersStatus(data) {
  const users = await getKeys("user-*");
  const usersData = [];

  if (users) {
    for (let i = 0; i < users.length; i++) {
      const user = await getCache(users[i]);
      if (user) {
        usersData.push({
          id: user.id,
          socketId: user.socketId,
          status: user.status,
          role: user.role,
        });
      }
    }
  }
  // filter users
  const usersFiltered = usersData.filter((user) => {
    return data.includes(user.id);
  });
  return usersFiltered;
}

module.exports = {
  joinUser,
  getUser,
  getUsers,
  deleteUser,
  setUserStatus,
  checkUserStatus,
  requestUsersStatus,
};
