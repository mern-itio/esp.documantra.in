const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const router = express.Router();
const {userList,userStatusToggle,getUserDetail,updateUserDetail,updateUserPassword} = require('../controllers/mainController');
router.get('/user-list',userList);
router.patch('/user-status/toggle/:id',userStatusToggle);
router.get('/user/:id', getUserDetail);
router.patch('/user/update/:id', updateUserDetail);
router.patch('/user/password/:id', updateUserPassword)
module.exports = router;
