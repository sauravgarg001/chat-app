var express = require('express');
var router = express.Router();

//Controllers
const userController = require("../controllers/userController");

//Middlewares
const auth = require('../middlewares/auth')

router.route('/signup').post(userController.signUp);

router.route('/login').post(userController.login);

router.route('/logout').post(auth.isAuthorized, userController.logout);

module.exports = router;