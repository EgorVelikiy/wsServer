import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pino from 'pino';
import pinoPretty from 'pino-pretty';
import chat from './db/chat.js'

const logger = pino(pinoPretty());
const app = express();


app.use(cors());

app.use(
  bodyParser.json({
    type(req) {
      return true;
    },
  })
);

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

const port = process.env.PORT || 7070;
const server = createServer(app)
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message)

    if (parsedMessage.userReg) {

      chat.addUser(parsedMessage.userReg)

      const messages = chat.messages
      const users = chat.users
      ws.send(JSON.stringify({ messages }));

      Array.from(wss.clients)
        .filter(client => client.readyState == ws.OPEN)
        .forEach(client => client.send(JSON.stringify({ users })));

      return
    } else if (parsedMessage.closeName) {

      const exitUser = parsedMessage.closeName
      chat.users = chat.users.filter((user) => user.name !== exitUser);

      const users = chat.users
      
      Array.from(wss.clients)
        .filter(client => client.readyState == ws.OPEN)
        .forEach(client => client.send(JSON.stringify({  users })))
      
      return
    }

    const data = parsedMessage["msg"];
    const userName = parsedMessage["userName"];

    const eventData = JSON.stringify(chat.newMessage(userName, data));

    Array.from(wss.clients)
      .filter(client => client.readyState == ws.OPEN)
      .forEach(client => client.send(eventData));
      
  })

})

server.listen(port, () => logger.info(`Server has been started on http://localhost:${port}`))
