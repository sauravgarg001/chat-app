const socketio = require('socket.io');
const mongoose = require('mongoose');
const shortid = require('shortid');
const events = require('events');

const eventEmitter = new events.EventEmitter();

//Libraries
const token = require("./tokenLib");
const redis = require("./redisLib");
const check = require("./checkLib");

//Models
const ChatModel = mongoose.model('Chat');


let setServer = (server) => {

    let io = socketio.listen(server);

    let myIo = io.of('/'); //Namespaces '/' -> for creating multilple RTC in single website with diffrent namspace

    myIo.on('connection', (socket) => { //All events should be inside this connection

        //socket.emit("<event name>",<data>)  -> triggering an event on client side
        //scoket.on("<event name", <callback function>) -> listening to an event from client side

        socket.emit("verifyUser", "");

        socket.on('set-user', (authToken, userId) => {

            console.log("set user called");

            token.verifyTokenWithoutSecret(authToken)
                .then((user) => {
                    console.log("user is verified..setting details");
                    let currentUser = user.data;
                    if (currentUser.userId != userId)
                        reject("authToken not correct");

                    socket.userId = currentUser.userId // setting socket user id to identify it further
                    let fullName = `${currentUser.firstName} ${currentUser.lastName}`

                    let key = currentUser.userId
                    let value = fullName

                    redis.setANewOnlineUserInHash("onlineUsers", key, value)
                        .then((res) => {

                            redis.getAllUsersInAHash('onlineUsers')
                                .then((result) => {
                                    console.log(`${fullName} is online`);

                                    // setting room name
                                    socket.room = 'incubChat';
                                    // joining chat-group room.
                                    socket.join(socket.room);
                                    socket.to(socket.room).broadcast.emit('online-user-list', result);
                                    socket.emit('online-user-list', result);

                                })
                                .catch((err) => {
                                    console.log(err);
                                });

                        })
                        .catch((err) => {
                            console.log(err);
                        });
                }).catch((err) => {
                    console.log("Auth Error:" + err);
                    socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
                });
        });


        socket.on('disconnect', () => { // disconnect the user from socket

            console.log(`${socket.userId} is disconnected`);

            if (socket.userId) {
                redis.deleteUserFromHash('onlineUsers', socket.userId);
                redis.getAllUsersInAHash('onlineUsers')
                    .then((result) => {
                        socket.leave(socket.room) // unsubscribe the user from his own channel
                        socket.to(socket.room).broadcast.emit('online-user-list', result);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }

        });


        socket.on('chat-msg', (data) => {

            data['chatId'] = shortid.generate();
            console.log("Message received:" + data);

            setTimeout(function() { //save chat after two second delay

                eventEmitter.emit('save-chat', data);

            }, 2000);
            myIo.emit(data.receiverId, data);

        });

        socket.on('typing', (fullName) => {

            socket.to(socket.room).broadcast.emit('typing', fullName);

        });

    });

}


/* Database operations are kept outside of socket.io code. */

// Saving chats to database.
eventEmitter.on('save-chat', (data) => {

    let newChat = new ChatModel({

        chatId: data.chatId,
        senderName: data.senderName,
        senderId: data.senderId,
        receiverName: data.receiverName || '',
        receiverId: data.receiverId || '',
        message: data.message,
        chatRoom: data.chatRoom || '',
        createdOn: data.createdOn

    });

    newChat.save()
        .then((result) => {
            if (check.isEmpty(result)) {
                console.error("Chat is not saved");
            } else {
                console.info("Chat saved");
            }
        })
        .catch((err) => {
            console.error(`Error occurred: ${err}`);
        });

});


module.exports = {
    setServer: setServer
}