import { io } from "socket.io-client";
import { getToken } from "../ultil/auth";

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  window.location.origin
)
  .trim()
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

export const socket = io(
  SOCKET_URL,
  {
    path: '/api/socket.io',
    autoConnect: false,
    transports: [
      "websocket",
      "polling",
    ],
  }
);

export const connectSocket = (accessToken?: string) => {
  const token = accessToken || getToken();

  if (!token) {
    socket.disconnect();
    return socket;
  }

  const shouldReconnect = Boolean(accessToken && socket.connected);
  if (shouldReconnect) {
    socket.disconnect();
  }

  socket.auth = {
    accessToken: token,
  };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const connectLiveSocket = () => {
  const token = getToken();
  socket.auth = token ? { accessToken: token } : {};
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};
