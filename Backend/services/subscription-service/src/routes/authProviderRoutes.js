const express = require('express');
const router = express.Router();

const {addAuthProvider, listAuthProviders, updateAuthProvider, toggleAuthProvider, deleteAuthProvider} = require('../controllers/authProviderController');

router.post('/', addAuthProvider); 
 
router.get('/', listAuthProviders);
router.put('/:id', updateAuthProvider);
router.post('/toggle', toggleAuthProvider);
router.delete('/:id', deleteAuthProvider);

module.exports = router;