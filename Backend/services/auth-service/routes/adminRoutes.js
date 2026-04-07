const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const router = express.Router();
const {userList, userStatusToggle,userDetail,updateUserDetail,updateUserPassword} = require('../controllers/adminController');
const { getReferralProgram, updateReferralProgram } = require('../controllers/referralProgramAdminController');
router.get('/user-list',userList);
router.get('/referral-program', getReferralProgram);
router.put('/referral-program', updateReferralProgram);
router.patch('/user-status/toggle/:id', userStatusToggle);
router.get('/user-detail/:id',userDetail);
router.patch('/user/update/:id',updateUserDetail);
router.patch(`/user/password/:id`,updateUserPassword)
module.exports = router;
