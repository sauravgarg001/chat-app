var express = require('express');
var router = express.Router();

//Controllers
const chatController = require("../controllers/chatController");

//Middlewares
const auth = require('../middlewares/auth')


router.route('/single').get(auth.isAuthorized, chatController.getUserChat);

router.route('/single/seen/sender/mark').put(auth.isAuthorized, chatController.markUserChatFromSenderSeen);

router.route('/single/delivered/sender/mark').put(auth.isAuthorized, chatController.markUserChatFromSenderDelivered);

router.route('/single/unseen/sender/count').get(auth.isAuthorized, chatController.countUserUnSeenChatFromSender);

router.route('/single/unseen/sender').get(auth.isAuthorized, chatController.getUserUnSeenChatFromSender);

router.route('/single/senders/users').get(auth.isAuthorized, chatController.getUserChatSenders); //unused


module.exports = router;