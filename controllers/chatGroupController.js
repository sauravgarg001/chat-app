const mongoose = require('mongoose');

//Libraries
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');

//Models
const ChatModel = mongoose.model('GroupChat');


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

    // markGroupChatSeen: (req, res) => {

    //     //Local Function Start-->

    //     let validateParams = () => {
    //         return new Promise((resolve, reject) => {
    //             if (check.isEmpty(req.body.chatIds) || check.isEmpty(req.body.receiverId)) {
    //                 logger.error('Parameters Missing', 'chatGroupController: markGroupChatSeen(): validateParams()', 9);
    //                 reject(response.generate(true, 'parameters missing.', 403, null));
    //             } else {
    //                 logger.info('Parameters Validated', 'chatGroupController: markGroupChatSeen(): validateParams()', 9);
    //                 resolve();
    //             }
    //         });
    //     }

    //     let modifyChat = () => {
    //         return new Promise((resolve, reject) => {
    //             let findQuery = {
    //                 chatId: { $in: req.body.chatIds },
    //                 receiverId: req.body.receiverId,
    //                 seen: false
    //             }

    //             let updateQuery = {
    //                 delivered: true,
    //                 seen: true
    //             }

    //             ChatModel.update(findQuery, updateQuery, {
    //                     multi: true //to update many
    //                 })
    //                 .exec()
    //                 .then((result) => {
    //                     if (result.n === 0) {
    //                         logger.info('No Chat Found', 'chatGroupController: markGroupChatSeen(): modifyChat()');
    //                         reject(response.generate(true, 'No Chat Found', 404, null));
    //                     } else {
    //                         logger.info('Chat Updated', 'chatGroupController: markGroupChatSeen(): modifyChat()');
    //                         resolve(result)
    //                     }
    //                 })
    //                 .catch((err) => {
    //                     logger.error(err.message, 'chatGroupController: markGroupChatSeen(): modifyChat()', 10);
    //                     reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
    //                 });
    //         });
    //     }

    //     //<--Local Functions End

    //     validateParams()
    //         .then(modifyChat)
    //         .then((result) => {
    //             res.send(response.generate(false, 'Chat marked as seen', 200, result));
    //         })
    //         .catch((error) => {
    //             res.send(error);
    //         })
    // },

    // markGroupChatDelivered: (req, res) => {

    //     //Local Function Start-->

    //     let validateParams = () => {
    //         return new Promise((resolve, reject) => {
    //             if (check.isEmpty(req.body.chatIds) || check.isEmpty(req.body.receiverId)) {
    //                 logger.error('Parameters Missing', 'chatGroupController: markGroupChatDelivered(): validateParams()', 9);
    //                 reject(response.generate(true, 'parameters missing.', 403, null));
    //             } else {
    //                 logger.info('Parameters Validated', 'chatGroupController: markGroupChatDelivered(): validateParams()', 9);
    //                 resolve();
    //             }
    //         });
    //     }

    //     let modifyChat = () => {
    //         return new Promise((resolve, reject) => {
    //             let findQuery = {
    //                 chatId: { $in: req.body.chatIds },
    //                 receiverId: req.body.receiverId,
    //                 delivered: false
    //             }

    //             let updateQuery = {
    //                 delivered: true
    //             }

    //             ChatModel.update(findQuery, updateQuery, {
    //                     multi: true //to update many
    //                 })
    //                 .exec()
    //                 .then((result) => {
    //                     if (result.n === 0) {
    //                         logger.info('No Chat Found', 'chatGroupController: markGroupChatDelivered(): modifyChat()');
    //                         reject(response.generate(true, 'No Chat Found', 404, null));
    //                     } else {
    //                         logger.info('Chat Updated', 'chatGroupController: markGroupChatDelivered(): modifyChat()');
    //                         resolve(result)
    //                     }
    //                 })
    //                 .catch((err) => {
    //                     logger.error(err.message, 'chatGroupController: markGroupChatDelivered(): modifyChat()', 10);
    //                     reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
    //                 });
    //         });
    //     }

    //     //<--Local Functions End

    //     validateParams()
    //         .then(modifyChat)
    //         .then((result) => {
    //             res.send(response.generate(false, 'Chat marked as delivered', 200, result));
    //         })
    //         .catch((error) => {
    //             res.send(error);
    //         })
    // },

    // markAllGroupChatDelivered: (req, res) => {

    //     //Local Function Start-->

    //     let validateParams = () => {
    //         return new Promise((resolve, reject) => {
    //             if (check.isEmpty(req.body.userId)) {
    //                 logger.error('Parameters Missing', 'chatGroupController: markAllGroupChatDelivered(): validateParams()', 9);
    //                 reject(response.generate(true, 'parameters missing.', 403, null));
    //             } else {
    //                 logger.info('Parameters Validated', 'chatGroupController: markAllGroupChatDelivered(): validateParams()', 9);
    //                 resolve();
    //             }
    //         });
    //     }

    //     let findUndeliveredChat = () => {
    //         return new Promise((resolve, reject) => {
    //             let findQuery = {
    //                 receiverId: req.body.userId,
    //                 delivered: false
    //             }

    //             ChatModel.find(findQuery)
    //                 .select('chatId senderId')
    //                 .sort('senderId')
    //                 .exec()
    //                 .then((chats) => {
    //                     if (check.isEmpty(chats)) {
    //                         logger.info('No Undelivered Chat Found', 'chatGroupController: markAllGroupChatDelivered(): findUndeliveredChat()');
    //                         reject(response.generate(true, 'No Undelivered Chat Found', 200, null));
    //                     } else {
    //                         logger.info('Undelivered Chat Found', 'chatGroupController: markAllGroupChatDelivered(): findUndeliveredChat()');
    //                         resolve(chats)
    //                     }
    //                 })
    //                 .catch((err) => {
    //                     logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): findUndeliveredChat()', 10);
    //                     reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
    //                 });
    //         });
    //     }

    //     let modifyChat = (chats) => {
    //         return new Promise((resolve, reject) => {
    //             let findQuery = {
    //                 receiverId: req.body.userId,
    //                 delivered: false
    //             }

    //             let updateQuery = {
    //                 delivered: true
    //             }

    //             ChatModel.update(findQuery, updateQuery, {
    //                     multi: true //to update many
    //                 })
    //                 .exec()
    //                 .then((result) => {
    //                     if (result.n === 0) {
    //                         logger.info('No Undelivered Chat Found', 'chatGroupController: markAllGroupChatDelivered(): modifyChat()');
    //                         reject(response.generate(true, 'No Undelivered Chat Found', 200, null));
    //                     } else {
    //                         logger.info('Undelivered Chat Updated', 'chatGroupController: markAllGroupChatDelivered(): modifyChat()');
    //                         resolve(chats)
    //                     }
    //                 })
    //                 .catch((err) => {
    //                     logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): modifyChat()', 10);
    //                     reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
    //                 });
    //         });
    //     }

    //     //<--Local Functions End

    //     validateParams()
    //         .then(findUndeliveredChat)
    //         .then(modifyChat)
    //         .then((result) => {
    //             res.send(response.generate(false, 'All Chat marked as delivered', 200, result));
    //         })
    //         .catch((error) => {
    //             res.send(error);
    //         })
    // },

    // countGroupUnSeenChat: (req, res) => {

    //     //Local Function Start-->

    //     let validateParams = () => {
    //         return new Promise((resolve, reject) => {
    //             if (check.isEmpty(req.query.userId)) {
    //                 logger.error('Parameters Missing', 'chatGroupController: countGroupUnSeenChat(): validateParams()', 9);
    //                 reject(response.generate(true, 'parameters missing.', 403, null));
    //             } else {
    //                 logger.info('Parameters Validted', 'chatGroupController: countGroupUnSeenChat(): validateParams()', 9);
    //                 resolve();
    //             }
    //         });
    //     }


    //     let countChat = () => {
    //         return new Promise((resolve, reject) => {

    //             let query = [{
    //                     "$match": {
    //                         "receiverId": req.query.userId,
    //                         "seen": false
    //                     }
    //                 },
    //                 {
    //                     "$group": {
    //                         "_id": {
    //                             "senderId": "$senderId"
    //                         },
    //                         "count": {
    //                             $sum: 1
    //                         }
    //                     }
    //                 },
    //                 {
    //                     "$project": {
    //                         "senderId": "$_id.senderId",
    //                         "count": "$count",
    //                         "_id": 0
    //                     }
    //                 }
    //             ];

    //             ChatModel.aggregate(query)
    //                 .then((result) => {
    //                     logger.info("Unseen Chat Count Found", 'chatGroupController: countGroupUnSeenChat(): countChat()', 10);
    //                     resolve(result);
    //                 })
    //                 .catch((err) => {
    //                     logger.error(err.message, 'chatGroupController: countGroupUnSeenChat(): countChat()', 10);
    //                     reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
    //                 });
    //         });
    //     }

    //     //<--Local Functions End

    //     validateParams()
    //         .then(countChat)
    //         .then((result) => {
    //             res.send(response.generate(false, 'unseen chat count found.', 200, result))
    //         })
    //         .catch((error) => {
    //             res.send(error)
    //         });
    // },

    // getGroupUnSeenChat: (req, res) => {

    //     //Local Function Start-->

    //     let validateParams = () => {
    //         return new Promise((resolve, reject) => {
    //             if (check.isEmpty(req.query.senderId) || check.isEmpty(req.query.receiverId)) {
    //                 logger.error('Parameters Missing', 'chatGroupController: getGroupUnSeenChat(): validateParams()', 9);
    //                 reject(response.generate(true, 'parameters missing.', 403, null));
    //             } else {
    //                 logger.info('Parameters Validated', 'chatGroupController: getGroupUnSeenChat(): validateParams()', 9);
    //                 resolve();
    //             }
    //         });
    //     }

    //     let findChats = () => {
    //         return new Promise((resolve, reject) => {

    //             let findQuery = {
    //                 senderId: req.query.senderId,
    //                 receiverId: req.query.receiverId,
    //                 seen: false
    //             };

    //             ChatModel.find(findQuery)
    //                 .select('-_id -__v')
    //                 .sort('-createdOn')
    //                 .exec()
    //                 .then((chats) => {
    //                     if (check.isEmpty(chats)) {
    //                         logger.info('No Chat Found', 'chatGroupController: getGroupUnSeenChat(): findChats()');
    //                         reject(response.generate(true, 'No Chat Found', 200, null));
    //                     } else {
    //                         logger.info('Chats Found', 'chatGroupController: getGroupUnSeenChat(): findChats()');
    //                         resolve(chats)
    //                     }
    //                 })
    //                 .catch((err) => {
    //                     logger.error(err.message, 'chatControllerr: getGroupUnSeenChat(): findChats()', 10);
    //                     reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
    //                 });
    //         });
    //     }

    //     //<--Local Functions End

    //     validateParams()
    //         .then(findChats)
    //         .then((chats) => {
    //             res.send(response.generate(false, 'chat found and listed.', 200, chats))
    //         })
    //         .catch((error) => {
    //             res.send(error)
    //         });
    // },

    // getGroupLastChats: (req, res) => {

    //     //Local Function Start-->

    //     let validateParams = () => {
    //         return new Promise((resolve, reject) => {
    //             if (check.isEmpty(req.query.userId)) {
    //                 logger.error('Parameters Missing', 'chatControllerr: getGroupLastChats(): validateParams()', 9);
    //                 reject(response.generate(true, 'parameters missing.', 403, null));
    //             } else {
    //                 logger.info('Parameters Validated', 'chatControllerr: getGroupLastChats(): validateParams()', 9);
    //                 resolve();
    //             }
    //         });
    //     }

    //     let findDistinctSenderLastChat = () => {

    //         return new Promise((resolve, reject) => {
    //             let query = [{
    //                     "$match": {
    //                         "$or": [{
    //                                 "senderId": req.query.userId
    //                             },
    //                             {
    //                                 "receiverId": req.query.userId
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 { "$sort": { "createdOn": -1 } },
    //                 {
    //                     "$group": {
    //                         "_id": {
    //                             "senderId": {
    //                                 $cond: { if: { $eq: ["$senderId", req.query.userId] }, then: "$receiverId", else: "$senderId" }
    //                             }
    //                         },
    //                         "MAX(createdOn)": {
    //                             "$max": "$createdOn"
    //                         },
    //                         "FIRST(message)": {
    //                             "$first": "$message"
    //                         }
    //                     }
    //                 },
    //                 {
    //                     "$project": {
    //                         "senderId": "$_id.senderId",
    //                         "createdOn": "$MAX(createdOn)",
    //                         "message": "$FIRST(message)",
    //                         "_id": 0
    //                     }
    //                 },
    //                 { "$sort": { "createdOn": -1 } }
    //             ];

    //             ChatModel.aggregate(query)
    //                 .then((chats) => {
    //                     if (check.isEmpty(chats)) {
    //                         logger.info('No Chat Found', 'chatControllerr: findDistinctSenderLastChat()', 10);
    //                         reject(response.generate(true, 'No Unseen Chat Group Found', 200, null));
    //                     } else {
    //                         logger.info('Chat Found', 'chatControllerr: findDistinctSenderLastChat()', 10);
    //                         resolve(chats);
    //                     }
    //                 })
    //                 .catch((err) => {
    //                     logger.error(err.message, 'chatControllerr: findDistinctSenderLastChat()', 10);
    //                     reject(response.generate(true, `error occurred: ${err.message}`, 500, null));
    //                 });

    //         });
    //     }

    //     //<--Local Functions End

    //     validateParams()
    //         .then(findDistinctSenderLastChat)
    //         .then((chats) => {
    //             res.send(response.generate(false, 'chat found and listed.', 200, chats));
    //         })
    //         .catch((error) => {
    //             res.send(error)
    //         });
    // }

}

module.exports = chatGroupController;