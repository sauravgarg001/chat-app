var express = require('express');
var router = express.Router();

//Controllers
const userController = require("../controllers/userController");

//Middlewares
const auth = require('../middlewares/auth')


router.route('/signup').post(userController.signUp);

router.route('/login').post(userController.login);

router.route('/logout').post(auth.isAuthorized, userController.logout);

router.route('/').get(auth.isAuthorized, userController.getUsers);

router.route('/:userId')
    .get(auth.isAuthorized, userController.getUser)
    .put(auth.isAuthorized, userController.editUser)
    .delete(auth.isAuthorized, userController.deleteUser);


module.exports = router;