const mongoose = require('mongoose');
const shortid = require('shortid');

//Libraries
const time = require('../libs/timeLib');
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');

//Models
const GroupModel = mongoose.model('Group');
const UserModel = mongoose.model('User');
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
                        req.user._id = user_id;
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

                                delete group.__v;
                                delete group.modifiedOn;

                                resolve({ group: group, members: members })
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

        let updateUserDetails = (data) => {
            return new Promise((resolve, reject) => {
                let group = data.group;
                let members = data.members;

                for (let i = 0; i < members.length; i++) {

                    UserModel.update({ _id: members[i].user_id }, {
                            $addToSet: {
                                groups: { group_id: group._id }
                            },
                            modifiedOn: time.now()
                        })
                        .then((result) => {
                            if (result.nModified != 0) {
                                logger.info('User Details Updated', 'groupController: updateUserDetails()', 10);

                                if (i == members.length - 1) {
                                    delete group._id;
                                    resolve(group);
                                }
                            } else {
                                logger.error('User Details Updated', 'groupController: updateUserDetails()', 10);
                                resolve(response.generate(true, 'Group created and user details updated', 403, null));
                            }
                        })
                        .catch((err) => {
                            logger.error(err.message, 'groupController: updateUserDetails()', 10);
                            reject(response.generate(true, 'Failed to update user details', 403, null));
                        });
                }
            });
        }

        //<--Local Functions End

        checkUserInput(req, res)
            .then(validateMembers)
            .then(createGroup)
            .then(updateUserDetails)
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
                        {
                            $project: {
                                "groupId": "$groupId",
                                "name": "$name",
                                "_id": 0
                            }
                        }
                    ])
                    .then((groups) => {
                        if (check.isEmpty(groups)) {
                            logger.info('No Group Found', 'groupController: getUnspammedGroups');
                            reject(response.generate(true, 'No Group Found', 404, null));
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
    },

    spamGroup: (req, res) => {

        //Local Function Start-->

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.groupId)) {
                    logger.error('Missing Field', 'groupController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'groupController: validateField()', 10);
                    resolve();
                }
            });
        }

        let getSpamGroupObjectId = () => {
            return new Promise((resolve, reject) => {

                GroupModel.findOne({ groupId: req.body.groupId })
                    .select('_id')
                    .exec()
                    .then((spamGroup) => {
                        if (check.isEmpty(spamGroup)) {
                            logger.error('No Spam Group Found', 'groupController: findGroupAndGetObjectId()', 7);
                            reject(response.generate(true, 'No Group Details Found', 404, null));
                        } else {
                            logger.info('Spam Group Found', 'groupController: findGroupAndGetObjectId()', 10);
                            req.body["_id"] = spamGroup._id;
                            resolve(req.user.userId);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: findGroupAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find spam group', 500, null));
                    });
            });
        }

        let leaveGroup = (user_id) => {
            return new Promise((resolve, reject) => {
                UserModel.update({
                        userId: req.user.userId,
                    }, {
                        $pull: {
                            groups: { group_id: req.body._id }
                        }
                    }, { upsert: true })
                    .then((result) => {
                        if (result.n == 1) {
                            logger.info('User Left Group', 'groupController: leaveGroup()', 10);
                            resolve(user_id);
                        } else {
                            logger.error('User Unable to Leave Group', 'groupController: leaveGroup()', 10);
                            resolve(response.generate(true, 'User unable to leave group', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: leaveGroup()', 10);
                        reject(response.generate(true, 'Failed to leave group', 500, null));
                    });
            });
        }

        let updateGroupInSpam = (user_id) => {
            return new Promise((resolve, reject) => {

                SpamModel.update({
                        group_id: req.body._id
                    }, {
                        $addToSet: {
                            by: { user_id: user_id }
                        },
                        modifiedOn: time.now()
                    }, { upsert: true }) //Insert if document not present
                    .then((result) => {

                        if (!check.isEmpty(result.upserted) || result.nModified != 0) {
                            logger.info('Group Spammed', 'groupController: updateGroupInSpam()', 10);
                            resolve(response.generate(false, 'Group spammed', 200, null));
                        } else {
                            logger.error('Group Unable to Spam', 'groupController: updateGroupInSpam()', 10);
                            resolve(response.generate(true, 'Group unable to spam', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: updateGroupInSpam()', 10);
                        reject(response.generate(true, 'Failed to spam group', 500, null));
                    });

            });
        }

        //<--Local Functions End

        validateField(req, res)
            .then(getSpamGroupObjectId)
            .then(findUserAndGetObjectId)
            .then(leaveGroup)
            .then(updateGroupInSpam)
            .then((response) => {
                res.status(200);
                res.send(response);
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    getGroup: (req, res) => {

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.groupId)) {
                    logger.error('Missing Field', 'groupController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'groupController: validateField()', 10);
                    resolve(req.user.userId);
                }
            });
        }

        let getGroupInfo = (user_id) => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    groupId: req.query.groupId,
                    members: {
                        $elemMatch: {
                            user_id: user_id
                        }
                    }
                };

                GroupModel.findOne(findQuery, { _id: 0, __v: 0, modifiedOn: 0 })
                    .populate('members.user_id', '-_id userId firstName lastName')
                    .exec()
                    .then((group) => {
                        logger.info('Group Found', 'groupController: getGroupInfo', 10);
                        resolve(group)
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: getGroupInfo', 10);
                        reject(response.generate(true, 'Failed to get group details', 403, null));
                    });
            });
        }

        validateField(req, res)
            .then(findUserAndGetObjectId)
            .then(getGroupInfo)
            .then((group) => {
                res.status(200);
                res.send(response.generate(false, 'Group fetched', 200, group));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });
    }
}

module.exports = groupController;