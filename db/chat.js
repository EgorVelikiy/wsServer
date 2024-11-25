import moment from 'moment';

const chat = {
    users: [],
    messages: [],
    
    addUser(userName) {
      const user = {
        name: userName, 
        created: moment().format('DD.MM.YY HH:mm'), 
      }
      this.users.push(user);
      return user
    },
    
    newMessage(userName, data) {
      const newMessage = {
        name: userName,
        message: data,
        sended: moment().format('HH:mm DD.MM.YY')
      }

      this.messages.push(newMessage);
      return newMessage
    },

    deleteUser(userName) {
      this.users = this.users.filter(user => user.name !== userName)
    },
}

export default chat;