const socketio = require('socket.io');
const mongoose = require('mongoose');
const shortid = require('shortid');
const events = require('events');

const eventEmitter = new events.EventEmitter();

//Libraries
const token = require("./tokenLib");
const redis = require("./redisLib");
const check = require("./checkLib");
const time = require("./timeLib");

//Models
const SingleChatModel = mongoose.model('SingleChat');
const GroupChatModel = mongoose.model('GroupChat');
const UserModel = mongoose.model('User');


let setServer = (server) => {

    let io = socketio.listen(server);

    let myIo = io.of('/'); //Namespaces '/' -> for creating multilple RTC in single website with different namspace

    myIo.on('connection', (socket) => { //All events should be inside this connection

        //socket.emit("<event name>",<data>)  -> triggering an event on client side
        //scoket.on("<event name", <callback function>) -> listening to an event from client side

        socket.emit("verifyUser", "");
        //-------------------------------------------------
        socket.on('set-user', (authToken, userId) => {

            console.log("set user called");

            token.verifyTokenFromDatabase(authToken)
                .then((user) => {
                    console.log("user is verified..setting details");
                    let currentUser = user.data;
                    if (currentUser.userId != userId)
                        reject("authToken not correct");

                    socket.userId = currentUser.userId // setting socket user id to identify it further
                    let fullName = `${currentUser.firstName} ${currentUser.lastName}`

                    let key = currentUser.userId
                    let value = authToken

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {

                            let timeout = 0;

                            if (result[key]) { //check whether user is already logged somewhere

                                console.log(`${fullName} is already online`);
                                myIo.emit('auth-error@' + result[key], { status: 500, error: 'Already logged somewhere' });
                                timeout = 500;

                            }

                            setTimeout(function() {

                                redis.setANewOnlineUserInHash("onlineUsers", key, value)
                                    .then((res) => {

                                        redis.getAllUsersInAHash('onlineUsers')
                                            .then((result) => {
                                                console.log(`${fullName} is online`);

                                                // setting room name
                                                socket.room = 'incubChat';
                                                // joining chat-group room.
                                                socket.join(socket.room);
                                                socket.to(socket.room).broadcast.emit('online-user-list', Object.keys(result));
                                                socket.emit('online-user-list', Object.keys(result));

                                            })
                                            .catch((err) => {
                                                console.log(err);
                                            });

                                    })
                                    .catch((err) => {
                                        console.log(err);
                                    });

                            }, timeout);

                        })
                        .catch((err) => {
                            console.log(err);
                        });
                }).catch((err) => {
                    console.log("Auth Error:" + err);
                    socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
                });
        });
        //-------------------------------------------------
        socket.on('configure-groups', (data) => {
            let groups = data.groups;

            token.verifyTokenFromDatabase(data.authToken).then((user) => { //To check whether the user authToken exists

                if (user.data.userId == data.userId) {
                    for (let i = 0; i < groups.length; i++) {
                        // joining chat-group room.
                        socket.join(groups[i].group_id.groupId);
                    }
                    console.log("Groups configured");
                } else {
                    console.log("Somewhen tried to send message using " + chatMessage.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
            });
        });
        //-------------------------------------------------
        socket.on('single-chat-msg', (data) => {
            let chatMessage = data.chatMessage;

            token.verifyTokenFromDatabase(data.authToken).then((user) => { //To check whether the user authToken exists

                if (user.data.userId == chatMessage.senderId) {
                    chatMessage['chatId'] = shortid.generate();
                    myIo.emit("getChatId@" + data.authToken, chatMessage['chatId']);
                    console.log("Message received:" + chatMessage);

                    setTimeout(function() { //save chat after one second delay

                        eventEmitter.emit('save-single-chat', chatMessage);

                    }, 1000);

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            console.log(result[chatMessage.receiverId]);

                            myIo.emit("receive-single@" + result[chatMessage.receiverId], chatMessage);
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to send message using " + chatMessage.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
            });
        });

        //-------------------------------------------------
        socket.on('group-chat-msg', (data) => {
            let chatMessage = data.chatMessage;

            token.verifyTokenFromDatabase(data.authToken).then((user) => { //To check whether the user authToken exists

                if (user.data.userId == chatMessage.senderId) {
                    chatMessage['chatId'] = shortid.generate();
                    myIo.emit("getChatId@" + data.authToken, chatMessage['chatId']);
                    console.log("Message received:" + chatMessage);

                    setTimeout(function() { //save chat after one second delay

                        eventEmitter.emit('save-group-chat', chatMessage);

                    }, 1000);

                    socket.to(chatMessage.groupId).broadcast.emit("receive-group", chatMessage);

                } else {
                    console.log("Somewhen tried to send message using " + chatMessage.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
            });
        });
        //-------------------------------------------------
        socket.on('typing-single', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.senderId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            myIo.emit('typing-single@' + result[data.receiverId], data.senderId);
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to check typing status using " + data.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });
        //-------------------------------------------------
        socket.on('typing-group', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.senderId) {
                    socket.to(data.groupId).broadcast.emit("typing-group", { groupId: data.groupId, senderName: data.senderName });
                } else {
                    console.log("Somewhen tried to check typing status using " + data.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('delivered-single', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.receiverId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            myIo.emit('delivered-single@' + result[data.senderId], { chatIds: data.chatIds, receiverId: data.receiverId });
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to mark delivered status using " + data.receiverId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('delivered-group', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.receiverId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {

                            let senderId = data.senderIds[0];
                            let chatIds = Array();

                            for (let i = 0; i < data.senderIds.length; i++) {

                                chatIds.push(data.chatIds[i]);
                                if (senderId != data.senderIds[i] ||
                                    i == data.senderIds.length - 1) {
                                    socket.to(data.groupId)
                                        .broadcast.emit("delivered-group@" + result[senderId], { chatIds: chatIds, receiverId: data.receiverId });
                                    senderId = data.senderIds[i];
                                    chatIds = Array();
                                }

                            }

                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to mark delivered status using " + data.receiverId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('seen-single', (data) => {

            console.log('Seen Message: ' + JSON.stringify(data));

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.receiverId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            myIo.emit('seen-single@' + result[data.senderId], { chatIds: data.chatIds, receiverId: data.receiverId });
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to mark seen status using " + data.receiverId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('seen-group', (data) => {

            console.log('Seen Message: ' + JSON.stringify(data));

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.receiverId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            let senderId = data.senderIds[0];
                            let chatIds = Array();

                            for (let i = 0; i < data.senderIds.length; i++) {

                                chatIds.push(data.chatIds[i]);
                                if (senderId != data.senderIds[i] ||
                                    i == data.senderIds.length - 1) {
                                    socket.to(data.groupId)
                                        .broadcast.emit("seen-group@" + result[senderId], { chatIds: chatIds, receiverId: data.receiverId });
                                    senderId = data.senderIds[i];
                                    chatIds = Array();
                                }

                            }
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to mark seen status using " + data.receiverId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('disconnect', () => { // disconnect the user from socket

            console.log(`${socket.userId} is disconnected`);
            let userData = {
                userId: socket.userId,
                lastSeen: time.now()
            }

            if (socket.userId) {
                redis.deleteUserFromHash('onlineUsers', socket.userId);
                redis.getAllUsersInAHash('onlineUsers')
                    .then((result) => {
                        socket.leave(socket.room) // unsubscribe the user from his own channel
                        socket.to(socket.room).broadcast.emit('online-user-list', Object.keys(result));

                        setTimeout(function() { //save lastSeen after one second delay

                            eventEmitter.emit('save-last-seen', userData);

                        }, 1000);
                        socket.to(socket.room).broadcast.emit('last-seen', userData);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }

        });
    });
}


/* Database operations are kept outside of socket.io code. */

// Saving chats to database.
eventEmitter.on('save-single-chat', (data) => {

    let newChat = new SingleChatModel({

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

// Saving chats to database.
eventEmitter.on('save-group-chat', (data) => {

    let newChat = new GroupChatModel({

        chatId: data.chatId,
        groupId: data.groupId,
        groupName: data.groupName,
        senderName: data.senderName,
        senderId: data.senderId,
        message: data.message

    });

    newChat.save()
        .then((result) => {
            if (check.isEmpty(result)) {
                console.error("Group Chat is not saved");
            } else {
                console.info("Group Chat saved");
            }
        })
        .catch((err) => {
            console.error(`Error occurred: ${err}`);
        });

});

// Saving lastSeen of user to database.
eventEmitter.on('save-last-seen', (data) => {

    UserModel.update({ userId: data.userId }, { lastSeen: data.lastSeen })
        .then((result) => {
            if (result.n == 0) {
                console.error("Last seen is not saved");
            } else {
                console.info("Last seen saved");
            }
        })
        .catch((err) => {
            console.error(`Error occurred: ${err}`);
        });

});


module.exports = {
    setServer: setServer
}