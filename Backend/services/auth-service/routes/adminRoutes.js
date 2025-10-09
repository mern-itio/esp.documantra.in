const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const router = express.Router();
const {userList, userStatusToggle,userDetail,updateUserDetail,updateUserPassword} = require('../controllers/adminController');
router.get('/user-list',userList);
router.patch('/user-status/toggle/:id', userStatusToggle);
router.get('/user-detail/:id',userDetail);
router.patch('/user/update/:id',updateUserDetail);
router.patch(`/user/password/:id`,updateUserPassword)
module.exports = router;
