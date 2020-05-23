const mongoose = require('mongoose');

//Libraries
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');

//Models
const UserModel = mongoose.model('User');
const ChatModel = mongoose.model('Chat');


let chatController = {

    getUserChat: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.senderId) || check.isEmpty(req.query.receiverId)) {
                    logger.error('Parameters Missing', 'chatController: getUserChat(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: getUserChat(): validateParams()', 9);
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
                            ]
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
                    receiverId: req.body.receiverId
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
                res.send(response.generate(false, 'chat found and updated.', 200, result));
            })
            .catch((error) => {
                res.send(error);
            })
    },

    markUserChatFromSenderDelivered: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.chatId) || check.isEmpty(req.body.receiverId)) {
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
                    chatId: req.body.chatId,
                    receiverId: req.body.receiverId
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
                res.send(response.generate(false, 'chat found and updated.', 200, result));
            })
            .catch((error) => {
                res.send(error);
            })
    },

    countUserUnSeenChatFromSender: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.senderId) || check.isEmpty(req.query.receiverId)) {
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

                let findQuery = {
                    senderId: req.query.senderId,
                    receiverId: req.query.receiverId,
                    seen: false
                }

                ChatModel.count(findQuery)
                    .exec()
                    .then((result) => {
                        logger.info("Unseen Chat Count Found", 'chatController: countChat()', 10);
                        resolve(result);
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: countChat()', 10);
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
                            logger.info('No Chat Found', 'chatController: findChats()');
                            reject(response.generate(true, 'No Chat Found', 404, null));
                        } else {
                            logger.info('Chats Found', 'chatController: findChats()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatControllerr: findChats()', 10);
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

    getUserChatSenders: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.userId)) {
                    logger.error('Parameters Missing', 'chatControllerr: getUserChatSenders(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatControllerr: getUserChatSenders(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let findDistinctSender = () => {
            return new Promise((resolve, reject) => {

                ChatModel.distinct('senderId', {
                        receiverId: req.query.userId,
                    })
                    .exec()
                    .then((senderIds) => {
                        if (check.isEmpty(senderIds)) {
                            logger.info('No Unseen Chat User Found', 'chatControllerr: findDistinctSender()', 10);
                            reject(response.generate(true, 'No Unseen Chat User Found', 404, null));
                        } else {
                            logger.info('User Found And userIds Listed', 'chatControllerr: findDistinctSender()', 10);
                            resolve(senderIds);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatControllerr: findDistinctSender()', 10);
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
                    });
            });
        }

        let findUserInfo = (senderIds) => {
            return new Promise((resolve, reject) => {
                UserModel.find({
                        senderId: { $in: senderIds }
                    })
                    .select('-_id -__v -password -email -mobileNumber')
                    .exec()
                    .then((users) => {
                        if (check.isEmpty(users)) {
                            logger.info('No User Found', 'chatControllerr: findUserInfo()', 10);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('User Found And userIds Listed.', 'chatControllerr: findUserInfo()', 10);
                            resolve(users);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatControllerr: findUserInfo()', 10)
                        reject(response.generate(true, `error occurred: ${err.message}`, 500, null))
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(findDistinctSender)
            .then(findUserInfo)
            .then((users) => {
                res.send(response.generate(false, 'user found and listed.', 200, users));
            })
            .catch((error) => {
                res.send(error)
            });
    }

}

module.exports = chatController;