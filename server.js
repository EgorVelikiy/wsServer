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

const router = express.Router()

router.post('/createUser', function(req, res, next) {
  try {
    const { userName } = req.body;
    if (chat.users.some((user) => user.name == userName )) {
      throw new Error('Пользователь с таким именем уже существует')
    }

    chat.addUser(userName);
    res.send(JSON.stringify(userName)).end()
  } catch (e) {
    res.status(409).send(JSON.stringify({ 'error': e.message }))
  }
  next();
})

app.use(router);

const port = process.env.PORT || 7070;
const server = createServer(app)
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const messages = chat.messages
  const users = chat.users
  ws.send(JSON.stringify({ messages }));
  ws.send(JSON.stringify({ users }));

  ws.on('message', (message) => {

    const parsedMessage = JSON.parse(message)

    if (parsedMessage.userReg) {

      const user = parsedMessage.userReg

      Array.from(wss.clients)
        .filter(client => client.readyState == ws.OPEN)
        .forEach(client => client.send(JSON.stringify({ newUser: user })));

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
