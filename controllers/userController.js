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
const UserModel = mongoose.model('User');
const AuthModel = mongoose.model('Auth');


let userController = {

    signUp: (req, res) => {

        let validateUserInput = () => {
                return new Promise((resolve, reject) => {
                    if (!req.body.email || !req.body.password) {
                        logger.error('Field Missing During User Creation', 'userController: validateUserInput()', 5);
                        reject(response.generate(true, 'One or More Parameter(s) is missing', 400, null));
                    } else if (!validate.email(req.body.email)) {
                        logger.error('Email Field Not Valid During User Creation', 'userController: validateUserInput()', 5);
                        reject(response.generate(true, 'Email does not met the requirement', 400, null));
                    } else if (!validate.password(req.body.password)) {
                        logger.error('Password Field Not Valid During User Creation', 'userController: validateUserInput()', 5);
                        reject(response.generate(true, 'Password does not met the requirement', 400, null));
                    } else {
                        logger.info('User input validated', 'userController: validateUserInput()', 5);
                        resolve(req);
                    }
                });
            } // end validate user input
        let createUser = () => {
                return new Promise((resolve, reject) => {

                    let newUser = {
                        userId: shortid.generate(),
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email.toLowerCase(),
                        mobileNumber: req.body.mobileNumber,
                        password: password.hashpassword(req.body.password),
                        createdOn: time.now()
                    };

                    UserModel.create(newUser)
                        .then((user) => {
                            logger.info('User created', 'userController: createUser', 10);
                            resolve(user.toObject());
                        })
                        .catch((err) => {
                            logger.error(err, 'userController: createUser', 10);
                            reject(response.generate(true, 'Failed to create user', 403, null));
                        });

                });
            } // end create user function


        validateUserInput(req, res)
            .then(createUser)
            .then((user) => {
                delete user.password;
                res.send(response.generate(false, 'User created', 200, user));
            })
            .catch((err) => {
                console.log(err);
                res.send(err);
            });

    },

    login: (req, res) => {
        let findUser = () => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ email: req.body.email })
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'userController: findUser()', 7);
                            reject(response.generate(true, 'No User Details Found', 404, null));
                        } else {
                            logger.info('User Found', 'userController: findUser()', 10);
                            resolve(user);
                        }
                    })
                    .catch((err) => {
                        logger.error(err, 'userController: findUser()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let validatePassword = (user) => {
            return new Promise((resolve, reject) => {
                password.comparePassword(req.body.password, user.password)
                    .then((isMatch) => {
                        if (isMatch) {
                            logger.info('Password validated', 'userController: validatePassword()', 10);
                            let userObj = user.toObject();
                            delete userObj.password;
                            delete userObj._id;
                            delete userObj.__v;
                            delete userObj.createdOn;
                            delete userObj.modifiedOn;
                            resolve(userObj);
                        } else {
                            logger.error('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10);
                            reject(response.generate(true, 'Wrong Password.Login Failed', 400, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err, 'userController: validatePassword()', 10);
                        reject(response.generate(true, 'Login Failed', 500, null));
                    });
            });
        }

        let generateToken = (user) => {
            return new Promise((resolve, reject) => {
                token.generateToken(user)
                    .then((tokenDetails) => {
                        logger.info('Token Generated', 'userController: generateToken()', 10);
                        tokenDetails.userId = user.userId;
                        tokenDetails.user = user;
                        resolve(tokenDetails);
                    })
                    .catch((err) => {
                        logger.error(err, 'userController: generateToken()', 10);
                        reject(response.generate(true, 'Failed To Generate Token', 500, null));
                    });
            });
        }
        let saveToken = (tokenDetails) => {
            let newAuthToken = new AuthModel({
                userId: tokenDetails.userId,
                authToken: tokenDetails.token,
                tokenSecret: tokenDetails.tokenSecret,
                tokenGenerationTime: time.now()
            });
            return new Promise((resolve, reject) => {
                AuthModel.create(newAuthToken)
                    .then((token) => {
                        logger.info('Token Saved', 'userController: saveToken()', 10);
                        let responseBody = {
                            authToken: token.authToken,
                            user: token.user
                        }
                        resolve(responseBody);
                    })
                    .catch((err) => {
                        logger.error(err, 'userController: saveToken()', 10);
                        reject(response.generate(true, 'Failed To Generate Token', 500, null));
                    });
            });
        }

        findUser(req, res)
            .then(validatePassword)
            .then(generateToken)
            .then(saveToken)
            .then((resolve) => {
                res.status(200);
                res.send(response.generate(false, 'Login Successful', 200, resolve));
            })
            .catch((err) => {
                console.log(err);
                res.status(err.status);
                res.send(err);
            });
    },

    logout: (req, res) => {
        AuthModel.findOneAndDelete({ userId: req.user.userId })
            .then((result) => {
                if (check.isEmpty(result)) {
                    logger.info('User already Loggedout', 'userController: saveToken()', 10);
                    res.send(response.generate(true, 'Already Logged Out or Invalid UserId', 404, null))
                } else {
                    logger.info('User Loggedout', 'userController: saveToken()', 10);
                    res.send(response.generate(false, 'Logged Out Successfully', 200, null));
                }
            })
            .catch((err) => {
                logger.error(err, 'user Controller: logout', 10);
                res.send(response.generate(true, `error occurred: ${err.message}`, 500, null));
            });
    }
}

module.exports = userController;