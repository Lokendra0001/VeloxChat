const { Server } = require("socket.io");
const Chats = require('../models/chat-model');
const Users = require('../models/user-model');

const userSocketMap = {};

const allowedOrigin = ["http://localhost:5173", "https://veloxchat.vercel.app"]


const setUpSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: allowedOrigin,
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log("Socket Connected:", socket.id);

        socket.on('join', async (userId) => {
            userSocketMap[userId] = socket.id;
            socket.userId = userId; // ✅ Store userId on socket
            await Users.updateOne({ _id: userId }, { status: "online" });
            console.log(`User ${userId} is now online`);
            socket.broadcast.emit("user-online", userId);
        });

        socket.on('send-message', async ({ message, sender_id, receiver_id, group_id, groupMembers, senderProfilePic, senderName }) => {
            const chat = await Chats.create({ message, sender_id, receiver_id, group_id });

            const msg = {
                ...chat.toObject(), senderProfilePic, senderName
            }


            if (!groupMembers) {
                const receiverSocketId = userSocketMap[receiver_id];
                if (receiverSocketId) {
                    socket.to(receiverSocketId).emit('received-message', chat);
                    socket.to(receiverSocketId).emit('friend-stopTyping', sender_id)
                }
            } else {
                const members = JSON.parse(groupMembers);
                members.forEach(member => {
                    const receiverSocketId = userSocketMap[member];
                    if (receiverSocketId) {
                        socket.to(receiverSocketId).emit('received-message', msg);
                    }
                });
            }

        });

        socket.on('send-request', (payload) => {
            const targetSocketId = userSocketMap[payload];
            if (targetSocketId) {
                socket.to(targetSocketId).emit('received-request', payload);
            }
        });

        socket.on('onChange-request', (targetUserId) => {
            const targetSocketId = userSocketMap[targetUserId];
            if (targetSocketId) {
                socket.to(targetSocketId).emit('received-request', targetUserId);
            }
        });

        socket.on('request-accepted', (friend, receiver_id) => {
            const targetSocketId = userSocketMap[receiver_id];
            socket.to(targetSocketId).emit('addFriend-contactPanel', friend)
        })

        socket.on('typing', (payload) => {
            if (payload.groupMembers) {
                const { sender_name, groupMembers, groupId, msgLen } = payload;

                groupMembers.forEach(member => {
                    const receiverSocketId = userSocketMap[member];
                    if (receiverSocketId) {
                        socket.to(receiverSocketId).emit('group-typing', {sender_name, groupId});
                        if (msgLen === 0) {
                            socket.to(receiverSocketId).emit('group-stopTyping', groupId);
                        }
                    }
                });

            } else {
                const { sender_id, receiver_id, msgLen } = payload;
                const socketId = userSocketMap[receiver_id];

                if (socketId) {
                    socket.to(socketId).emit('friend-typing', sender_id);
                    if (msgLen === 0) {
                        socket.to(socketId).emit('friend-stopTyping', sender_id);
                    }

                }
            }
        });

        const handleUserDisconnect = async () => {
            const userId = socket.userId;
            if (userId) {
                delete userSocketMap[userId];
                await Users.updateOne({ _id: userId }, { status: "offline" });
                console.log(`User ${userId} is now offline`);
                socket.broadcast.emit("user-offline", userId);
            }

        }


        socket.on('logged-out', handleUserDisconnect);
        socket.on('disconnect', handleUserDisconnect);
    });
}
module.exports = setUpSocket;
