const mongoose = require('mongoose');

//Libraries
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');

//Models
const ChatModel = mongoose.model('GroupChat');
const UserModel = mongoose.model('User');


let chatGroupController = {

    getGroupSeenChat: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.groupId)) {
                    logger.error('Parameters Missing', 'chatGroupController: getGroupSeenChat(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: getGroupSeenChat(): validateParams()', 9);
                    resolve()
                }
            });
        }


        let findChats = () => {
            return new Promise((resolve, reject) => {

                ChatModel.aggregate([{
                            $match: {
                                groupId: req.query.groupId
                            }
                        },
                        {
                            $sort: {
                                createdOn: -1
                            }
                        },
                        {
                            $skip: parseInt(req.query.skip) || 0
                        },
                        {
                            $limit: 10
                        },
                        {

                            $project: {
                                _id: 0,
                                chatId: '$chatId',
                                message: '$message',
                                createdOn: '$createdOn',
                                senderId: '$senderId',
                                senderName: '$senderName',
                                receiver: {
                                    $cond: {
                                        if: {

                                            $eq: ['$senderId', req.user.userId]
                                        },
                                        then: '$receiver',
                                        else: null
                                    }
                                }
                            },

                        }
                    ])
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatGroupController: findChats()');
                            reject(response.generate(false, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chat Found', 'chatGroupController: findChats()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: findChats()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            })
        }

        //<--Local Functions End

        validateParams()
            .then(findChats)
            .then((chats) => {
                res.send(response.generate(false, 'All Chats Listed', 200, chats));
            })
            .catch((error) => {
                res.send(error);
            });
    },

    markGroupChatSeen: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.chatIds)) {
                    logger.error('Parameters Missing', 'chatGroupController: markGroupChatSeen(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: markGroupChatSeen(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let modifyChat = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    chatId: { $in: req.body.chatIds }
                }

                let updateQuery = {
                    $addToSet: {
                        receiver: {
                            receiverId: req.user.userId,
                            receiverName: req.user.userName,
                            delivered: true,
                            seen: true
                        }
                    }
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true, //to update many
                        upsert: true
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Chat Found', 'chatGroupController: markGroupChatSeen(): modifyChat()');
                            reject(response.generate(true, 'No Chat Found', 404, null));
                        } else {
                            logger.info('Chat Updated', 'chatGroupController: markGroupChatSeen(): modifyChat()');
                            resolve(result)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markGroupChatSeen(): modifyChat()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(modifyChat)
            .then((result) => {
                res.send(response.generate(false, 'Chat marked as seen', 200, result));
            })
            .catch((error) => {
                res.send(error);
            })
    },

    markGroupChatDelivered: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.chatIds)) {
                    logger.error('Parameters Missing', 'chatGroupController: markGroupChatDelivered(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: markGroupChatDelivered(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let modifyChat = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    chatId: { $in: req.body.chatIds }
                }

                let updateQuery = {
                    $addToSet: {
                        receiver: {
                            receiverId: req.user.userId,
                            receiverName: req.user.userName,
                            delivered: true
                        }
                    }
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true, //to update many
                        upsert: true
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Chat Found', 'chatGroupController: markGroupChatDelivered(): modifyChat()');
                            reject(response.generate(true, 'No Chat Found', 404, null));
                        } else {
                            logger.info('Chat Updated', 'chatGroupController: markGroupChatDelivered(): modifyChat()');
                            resolve(result)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markGroupChatDelivered(): modifyChat()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(modifyChat)
            .then((result) => {
                res.send(response.generate(false, 'Chat marked as delivered', 200, result));
            })
            .catch((error) => {
                res.send(error);
            })
    },

    markAllGroupChatDelivered: (req, res) => {

        //Local Function Start-->

        let findGroupUserIn = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    userId: req.user.userId
                }

                UserModel.findOne(findQuery, { _id: 0, groups: 1 })
                    .populate('groups.group_id', 'groupId -_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.info('No Group Found', 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()');
                            reject(response.generate(true, 'No Group Found', 200, null));
                        } else {
                            logger.info('Groups Found', 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()');

                            let groupsArray = Array();
                            for (let i = 0; i < user.groups.length; i++) {
                                groupsArray.push(user.groups[i].group_id.groupId);
                            }

                            resolve(groupsArray)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        let findUndeliveredChat = (groups) => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    groupId: { $in: groups },
                    'senderId': {
                        $ne: req.user.userId
                    },
                    'receiver.receiverId': {
                        $ne: req.user.userId
                    }
                }
                console.log(findQuery);

                ChatModel.find(findQuery)
                    .select('-_id chatId')
                    .exec()
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Undelivered Chat Found', 'chatGroupController: markAllGroupChatDelivered(): findUndeliveredChat()');
                            reject(response.generate(true, 'No Undelivered Chat Found', 200, null));
                        } else {
                            logger.info('Undelivered Chat Found', 'chatGroupController: markAllGroupChatDelivered(): findUndeliveredChat()');

                            let chatsArray = Array();
                            for (let i = 0; i < chats.length; i++) {
                                chatsArray.push(chats[i].chatId);
                            }

                            resolve(chatsArray)

                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): findUndeliveredChat()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        let modifyChat = (chats) => {
            return new Promise((resolve, reject) => {

                let findQuery = { chatId: { $in: chats } };

                let updateQuery = {
                    $addToSet: {
                        receiver: {
                            receiverId: req.user.userId,
                            receiverName: req.user.userName,
                            delivered: true
                        }
                    }
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true //to update many
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Undelivered Chat Found', 'chatGroupController: markAllGroupChatDelivered(): modifyChat()');
                            reject(response.generate(true, 'No Undelivered Chat Found', 200, null));
                        } else {
                            logger.info('Undelivered Chat Updated', 'chatGroupController: markAllGroupChatDelivered(): modifyChat()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): modifyChat()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        findGroupUserIn()
            .then(findUndeliveredChat)
            .then(modifyChat)
            .then((result) => {
                res.send(response.generate(false, 'All Chat marked as delivered', 200, result));
            })
            .catch((error) => {
                res.send(error);
            })
    },

    countGroupUnSeenChat: (req, res) => {

        let query = [{
            "$match": {
                'senderId': {
                    $ne: req.user.userId
                },
                "receiver": {
                    $elemMatch: {
                        "receiverId": req.user.userId,
                        "seen": false
                    }
                }
            }
        }, {
            "$group": {
                "_id": {
                    "groupId": "$groupId"
                },
                "count": {
                    $sum: 1
                }
            }
        }, {
            "$project": {
                "groupId": "$_id.groupId",
                "count": "$count",
                "_id": 0
            }
        }];

        ChatModel.aggregate(query)
            .then((result) => {
                logger.info("Unseen Chat Count Found", 'chatGroupController: countGroupUnSeenChat()', 10);
                res.send(response.generate(false, 'unseen chat count found.', 200, result))

            })
            .catch((err) => {
                logger.error(err.message, 'chatGroupController: countGroupUnSeenChat()', 10);
                res.send(response.generate(true, `error occurred: ${err.message}`, 500, null));
            });

    },

    getGroupUnSeenChat: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.groupId)) {
                    logger.error('Parameters Missing', 'chatGroupController: getGroupUnSeenChat(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: getGroupUnSeenChat(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let findChats = () => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    groupId: req.query.groupId,
                    "$or": [{
                            "receiver.receiverId": req.user.userId,
                            "seen": false
                        },
                        {
                            "receiver.receiverId": {
                                $ne: req.user.userId
                            }
                        }
                    ]
                };

                ChatModel.find(findQuery)
                    .select('-_id -__v')
                    .sort('-createdOn')
                    .exec()
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatGroupController: getGroupUnSeenChat(): findChats()');
                            reject(response.generate(true, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chats Found', 'chatGroupController: getGroupUnSeenChat(): findChats()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupControllerr: getGroupUnSeenChat(): findChats()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(findChats)
            .then((chats) => {
                res.send(response.generate(false, 'chat found and listed.', 200, chats))
            })
            .catch((error) => {
                res.send(error)
            });
    },

    getGroupLastChats: (req, res) => {

        let findGroupUserIn = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    userId: req.user.userId
                }

                UserModel.findOne(findQuery, { _id: 0, groups: 1 })
                    .populate('groups.group_id', 'groupId -_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.info('No Group Found', 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()');
                            reject(response.generate(true, 'No Group Found', 200, null));
                        } else {
                            logger.info('Groups Found', 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()');

                            let groupsArray = Array();
                            for (let i = 0; i < user.groups.length; i++) {
                                groupsArray.push(user.groups[i].group_id.groupId);
                            }
                            resolve(groupsArray)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        let findLastChat = (groups) => {
            return new Promise((resolve, reject) => {

                let query = [{
                        "$match": {
                            groupId: { $in: groups }
                        }
                    },
                    { "$sort": { "createdOn": -1 } },
                    {
                        "$group": {
                            "_id": {
                                "groupId": "$groupId"
                            },
                            "MAX(createdOn)": {
                                "$max": "$createdOn"
                            },
                            "FIRST(message)": {
                                "$first": "$message"
                            }
                        }
                    },
                    {
                        "$project": {
                            "groupId": "$_id.groupId",
                            "createdOn": "$MAX(createdOn)",
                            "message": "$FIRST(message)",
                            "_id": 0
                        }
                    },
                    { "$sort": { "createdOn": -1 } }
                ];

                ChatModel.aggregate(query)
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatGroupControllerr: findLastChat(): getGroupLastChats()', 10);
                            reject(response.generate(true, 'No Unseen Chat Group Found', 200, null));
                        } else {
                            logger.info('Chat Found', 'chatGroupControllerr: findLastChat(): getGroupLastChats()', 10);
                            resolve(chats)

                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupControllerr: findLastChat(): getGroupLastChats()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            })
        }

        //<--Local Functions End

        findGroupUserIn()
            .then(findLastChat)
            .then((chats) => {
                res.send(response.generate(false, 'chat found and listed.', 200, chats))
            })
            .catch((error) => {
                res.send(error)
            });
    }

}

module.exports = chatGroupController;