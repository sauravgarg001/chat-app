const mongoose = require('mongoose');
const shortid = require('shortid');

//Libraries
const time = require('../libs/timeLib');
const password = require('../libs/passwordLib');
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const validate = require('../libs/validationLib');
const check = require('../libs/checkLib');
const token = require('../libs/tokenLib');

//Models
const GroupModel = mongoose.model('Group');
const UserModel = mongoose.model('User');
const AuthModel = mongoose.model('Auth');
const SpamModel = mongoose.model('Spam');


let findUserAndGetObjectId = (userId) => {
    return new Promise((resolve, reject) => {

        UserModel.findOne({ userId: userId })
            .select('_id')
            .exec()
            .then((user) => {
                if (check.isEmpty(user)) {
                    logger.error('No User Found', 'groupController: findUserAndGetObjectId()', 7);
                    reject(response.generate(true, 'No User Found', 404, null));
                } else {
                    logger.info('User Found', 'groupController: findUserAndGetObjectId()', 10);
                    resolve(user._id);
                }
            })
            .catch((err) => {
                logger.error(err.message, 'groupController: findUserAndGetObjectId()', 10);
                reject(response.generate(true, 'Failed to find user', 500, null));
            });
    });
}


let groupController = {

    createGroup: (req, res) => {

        //Local Function Start-->

        let checkUserInput = () => {
            return new Promise((resolve, reject) => {
                if (!req.body.name || !req.body.members) {
                    logger.error('Field Missing During Group Creation', 'groupController: validateUserInput()', 5);
                    reject(response.generate(true, 'One or More Parameter(s) is missing', 400, null));
                } else if (check.isEmpty(req.body.members)) {
                    logger.error('Members Field Is Empty During Group Creation', 'groupController: validateUserInput()', 5);
                    reject(response.generate(true, 'Members field is empty', 400, null));
                } else {
                    logger.info('User Input Validated', 'groupController: validateUserInput()', 5);
                    resolve(req);
                }
            });
        }

        let validateMembers = () => {
            return new Promise((resolve, reject) => {

                for (let i = 0; i < req.body.members.length; i++) {
                    let userId = req.body.members[i].userId;
                    findUserAndGetObjectId(userId)
                        .then((user_id) => {
                            delete req.body.members[i].userId;
                            user_id = mongoose.Types.ObjectId(user_id);
                            req.body.members[i]["user_id"] = user_id;
                        }).catch((err) => {
                            reject(err);
                        });

                }
                //for admin
                let userId = req.user.userId;
                findUserAndGetObjectId(userId)
                    .then((user_id) => {
                        let members = req.body.members;
                        user_id = mongoose.Types.ObjectId(user_id);
                        members.push({ user_id: user_id, admin: true });
                        resolve(members);
                    }).catch((err) => {
                        reject(err);
                    });
            });
        }

        let createGroup = (members) => {
            return new Promise((resolve, reject) => {

                let newGroup = {
                    groupId: shortid.generate(),
                    name: req.body.name,
                    members: members
                };

                GroupModel.create(newGroup)
                    .then((group) => {
                        group.execPopulate('members.user_id', '-_id userId firstName lastName')
                            .then((group) => {
                                logger.info('Group Created', 'groupController: createUser', 10);
                                group = group.toObject();

                                delete group._id;
                                delete group.__v;
                                delete group.chats;
                                delete group.modifiedOn;

                                resolve(group)
                            })
                            .catch((err) => {
                                logger.error(err.message, 'groupController: createUser', 10);
                                reject(response.generate(true, 'Failed to create user', 403, null));
                            });
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: createUser', 10);
                        reject(response.generate(true, 'Failed to create user', 403, null));
                    });

            });
        }

        //<--Local Functions End

        checkUserInput(req, res)
            .then(validateMembers)
            .then(createGroup)
            .then((group) => {
                res.send(response.generate(false, 'Group created', 200, group));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    getAllGroups: (req, res) => {

        //Local Function Start-->

        let getUnspammedGroups = (user_id) => {
            return new Promise((resolve, reject) => {
                GroupModel.aggregate([{
                            $lookup: {
                                from: "spams",
                                localField: "_id",
                                foreignField: "group_id",
                                as: "spam"
                            }
                        },
                        {
                            $match: {
                                "spam.by.user_id": {
                                    $ne: user_id
                                },
                                "members.user_id": {
                                    $eq: user_id
                                }
                            }
                        },
                        { $sort: { "chats.createdOn": -1 } },
                        {
                            $project: {
                                "groupId": "$groupId",
                                "name": "$name",
                                "createdOn": { $arrayElemAt: ["$createdOn", 0] },
                                "message": { $arrayElemAt: ["$message", 0] },
                                "_id": 0
                            }
                        }, { $sort: { "createdOn": -1 } }
                    ])
                    .then((groups) => {
                        if (check.isEmpty(groups)) {
                            logger.info('No Group Found', 'groupController: getUnspammedGroups');
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('Groups Found', 'groupController: getUnspammedGroups');
                            resolve(response.generate(false, 'All Group Details Found', 200, groups));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: getUnspammedGroups', 10);
                        reject(response.generate(true, 'Failed To Find Group Details', 500, null));
                    });
            });
        }

        //<--Local Functions End

        findUserAndGetObjectId(req.user.userId)
            .then(getUnspammedGroups)
            .then((response) => {
                res.status(200);
                res.send(response);
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });
    }

}

module.exports = groupController;