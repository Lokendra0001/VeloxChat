require('dotenv').config();
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const http = require('http');
const mongoConnection = require('./config/mongoose');
const setUpSocket = require('./socket');
const userRouter = require('./routes/userRouter');
const chatRouter = require('./routes/chatRouter');
const contactRouter = require('./routes/contactRequestRouter');
const groupRouter = require('./routes/groupRouter')
const app = express();
const PORT = 3000;
const server = http.createServer(app);

mongoConnection(process.env.MONGO_URI)
    .then((msg) => console.log(msg))
    .catch((err) => console.log(err))

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const allowedOrigin = ["http://localhost:5173", "https://veloxchat.vercel.app"]
app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
}))

setUpSocket(server)

app.use('/user', userRouter);
app.use('/chat', chatRouter)
app.use('/contact', contactRouter)
app.use('/group', groupRouter)

server.listen(PORT, () => console.log("Server Started At 3000."))