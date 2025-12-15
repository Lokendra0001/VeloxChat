import { io } from "socket.io-client";
import serverObj from "./config";

const socket = io(serverObj.apikey, {
    withCredentials: true
})

export default socket;