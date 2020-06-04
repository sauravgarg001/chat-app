var express = require('express');
var router = express.Router();

//Controllers
const groupController = require("../controllers/groupController");

//Middlewares
const auth = require('../middlewares/auth')


router.route('/')
    .post(auth.isAuthorized, groupController.createGroup)
    .get(auth.isAuthorized, groupController.getGroup);

router.route('/all').get(auth.isAuthorized, groupController.getAllGroups);

// router.route('/add').post(auth.isAuthorized, groupController.addUser);

// router.route('/remove').delete(auth.isAuthorized, groupController.removeUser);

// router.route('/admin/make').put(auth.isAuthorized, groupController.markUserAdmin);

router.route('/spam').put(auth.isAuthorized, groupController.spamGroup);


module.exports = router;