import { io } from "socket.io-client";
const url = `${import.meta.env.VITE_HOST}:${import.meta.env.VITE_SERVER_PORT}`;
const socket = io(url);

export default socket;
