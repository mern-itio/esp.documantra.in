const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const router = express.Router();
const {userList} = require('../controllers/adminController');
router.get('/user-list',userList);

module.exports = router;
