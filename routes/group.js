var express = require('express');
var router = express.Router();

//Controllers
const groupController = require("../controllers/groupController");

//Middlewares
const auth = require('../middlewares/auth')


router.route('/').post(auth.isAuthorized, groupController.createGroup);

router.route('/all').get(auth.isAuthorized, groupController.getAllGroups);

// router.route('/add').post(auth.isAuthorized, groupController.addUser);

// router.route('/remove').delete(auth.isAuthorized, groupController.removeUser);

// router.route('/admin/make').put(auth.isAuthorized, groupController.markUserAdmin);

// router.route('/chat/seen/mark').put(auth.isAuthorized, groupController.markChatAsSeen);

// router.route('/chat/delivered/mark').put(auth.isAuthorized, groupController.markChatAsDelivered);

// router.route('/chat/seen/mark/all').put(auth.isAuthorized, groupController.markAllChatAsSeen);

// router.route('/chat/delivered/mark/all').put(auth.isAuthorized, groupController.markAllChatAsDelivered);

// router.route('/chat/unseen/count').get(auth.isAuthorized, chatController.counUnseenChatOfGroups);

// router.route('/chat/unseen').get(auth.isAuthorized, chatController.getUnseenChat);

// router.route('/chat/lastchat').get(auth.isAuthorized, chatController.getLastChatOfGroups);



module.exports = router;