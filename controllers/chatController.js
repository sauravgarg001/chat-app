const mongoose = require('mongoose');

//Libraries
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');

//Models
const ChatModel = mongoose.model('Chat');


let chatController = {

    getUserSeenChatFromSender: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.senderId) || check.isEmpty(req.query.receiverId)) {
                    logger.error('Parameters Missing', 'chatController: getUserSeenChatFromSender(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: getUserSeenChatFromSender(): validateParams()', 9);
                    resolve()
                }
            });
        }


        let findChats = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    $or: [{
                            $and: [
                                { senderId: req.query.senderId },
                                { receiverId: req.query.receiverId }
                            ],
                            seen: true
                        },
                        {
                            $and: [
                                { receiverId: req.query.senderId },
                                { senderId: req.query.receiverId }
                            ]
                        }
                    ]
                }

                ChatModel.find(findQuery)
                    .select('-_id -__v -chatRoom')
                    .sort('-createdOn') //Descending order
                    .skip(parseInt(req.query.skip) || 0)
                    .limit(10)
                    .exec()
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatController: findChats()');
                            reject(response.generate(false, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chat Found', 'chatController: findChats()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: findChats()', 10);
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

    markUserChatFromSenderSeen: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.chatIds) || check.isEmpty(req.body.receiverId)) {
                    logger.error('Parameters Missing', 'chatController: markUserChatFromSenderSeen(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: markUserChatFromSenderSeen(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let modifyChat = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    chatId: { $in: req.body.chatIds },
                    receiverId: req.body.receiverId,
                    seen: false
                }

                let updateQuery = {
                    delivered: true,
                    seen: true
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true //to update many
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Chat Found', 'chatController: markUserChatFromSenderSeen(): modifyChat()');
                            reject(response.generate(true, 'No Chat Found', 404, null));
                        } else {
                            logger.info('Chat Updated', 'chatController: markUserChatFromSenderSeen(): modifyChat()');
                            resolve(result)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: markUserChatFromSenderSeen(): modifyChat()', 10);
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

    markUserChatFromSenderDelivered: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.chatIds) || check.isEmpty(req.body.receiverId)) {
                    logger.error('Parameters Missing', 'chatController: markUserChatFromSenderDelivered(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: markUserChatFromSenderDelivered(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let modifyChat = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    chatId: { $in: req.body.chatIds },
                    receiverId: req.body.receiverId,
                    delivered: false
                }

                let updateQuery = {
                    delivered: true
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true //to update many
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Chat Found', 'chatController: markUserChatFromSenderDelivered(): modifyChat()');
                            reject(response.generate(true, 'No Chat Found', 404, null));
                        } else {
                            logger.info('Chat Updated', 'chatController: markUserChatFromSenderDelivered(): modifyChat()');
                            resolve(result)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: markUserChatFromSenderDelivered(): modifyChat()', 10);
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

    markAllUserChatFromSenderDelivered: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.userId)) {
                    logger.error('Parameters Missing', 'chatController: markAllUserChatFromSenderDelivered(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: markAllUserChatFromSenderDelivered(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let modifyChat = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    receiverId: req.body.userId,
                    delivered: false
                }

                let updateQuery = {
                    delivered: true
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true //to update many
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Undelivered Chat Found', 'chatController: markAllUserChatFromSenderDelivered(): modifyChat()');
                            reject(response.generate(true, 'No Undelivered Chat Found', 200, null));
                        } else {
                            logger.info('Undelivered Chat Updated', 'chatController: markAllUserChatFromSenderDelivered(): modifyChat()');
                            resolve(result)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: markAllUserChatFromSenderDelivered(): modifyChat()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(modifyChat)
            .then((result) => {
                res.send(response.generate(false, 'All Chat marked as delivered', 200, result));
            })
            .catch((error) => {
                res.send(error);
            })
    },

    countUserUnSeenChatFromSender: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.userId)) {
                    logger.error('Parameters Missing', 'chatController: countUserUnSeenChatFromSender(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validted', 'chatController: countUserUnSeenChatFromSender(): validateParams()', 9);
                    resolve();
                }
            });
        }


        let countChat = () => {
            return new Promise((resolve, reject) => {

                let query = [{
                        "$match": {
                            "receiverId": req.query.userId,
                            "seen": false
                        }
                    },
                    {
                        "$group": {
                            "_id": {
                                "senderId": "$senderId"
                            },
                            "count": {
                                $sum: 1
                            }
                        }
                    },
                    {
                        "$project": {
                            "senderId": "$_id.senderId",
                            "count": "$count",
                            "_id": 0
                        }
                    }
                ];

                ChatModel.aggregate(query)
                    .then((result) => {
                        logger.info("Unseen Chat Count Found", 'chatController: countUserUnSeenChatFromSender(): countChat()', 10);
                        resolve(result);
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: countUserUnSeenChatFromSender(): countChat()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(countChat)
            .then((result) => {
                res.send(response.generate(false, 'unseen chat count found.', 200, result))
            })
            .catch((error) => {
                res.send(error)
            });
    },

    getUserUnSeenChatFromSender: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.senderId) || check.isEmpty(req.query.receiverId)) {
                    logger.error('Parameters Missing', 'chatController: getUserUnSeenChatFromSender(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: getUserUnSeenChatFromSender(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let findChats = () => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    senderId: req.query.senderId,
                    receiverId: req.query.receiverId,
                    seen: false
                };

                ChatModel.find(findQuery)
                    .select('-_id -__v')
                    .sort('-createdOn')
                    .exec()
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatController: getUserUnSeenChatFromSender(): findChats()');
                            reject(response.generate(true, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chats Found', 'chatController: getUserUnSeenChatFromSender(): findChats()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatControllerr: getUserUnSeenChatFromSender(): findChats()', 10);
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

    getUserLastChatFromSenders: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.userId)) {
                    logger.error('Parameters Missing', 'chatControllerr: getUserLastChatFromSenders(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatControllerr: getUserLastChatFromSenders(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let findDistinctSenderLastChat = () => {

            return new Promise((resolve, reject) => {
                let query = [{
                        "$match": {
                            "$or": [{
                                    "senderId": req.query.userId
                                },
                                {
                                    "receiverId": req.query.userId
                                }
                            ]
                        }
                    },
                    { "$sort": { "createdOn": -1 } },
                    {
                        "$group": {
                            "_id": {
                                "senderId": {
                                    $cond: { if: { $eq: ["$senderId", req.query.userId] }, then: "$receiverId", else: "$senderId" }
                                }
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
                            "senderId": "$_id.senderId",
                            "createdOn": "$MAX(createdOn)",
                            "message": "$FIRST(message)",
                            "_id": 0
                        }
                    }
                ];

                ChatModel.aggregate(query)
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatControllerr: findDistinctSenderLastChat()', 10);
                            reject(response.generate(true, 'No Unseen Chat User Found', 404, null));
                        } else {
                            logger.info('Chat Found', 'chatControllerr: findDistinctSenderLastChat()', 10);
                            resolve(chats);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatControllerr: findDistinctSenderLastChat()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });

            });
        }

        //<--Local Functions End

        validateParams()
            .then(findDistinctSenderLastChat)
            .then((chats) => {
                res.send(response.generate(false, 'chat found and listed.', 200, chats));
            })
            .catch((error) => {
                res.send(error)
            });
    }

}

module.exports = chatController;