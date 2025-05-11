import { io } from "socket.io-client";

const socket = io("http://172.20.10.4:3001");

export default socket;