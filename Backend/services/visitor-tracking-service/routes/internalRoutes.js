const express = require('express');
const { requireInternalSecret } = require('../middleware/internalAuth');
const { linkCustomer } = require('../controllers/linkController');
const { getCustomerJourney, getVisitorJourney } = require('../controllers/journeyController');

const router = express.Router();

router.use(requireInternalSecret);
router.post('/v1/link-customer', linkCustomer);
router.get('/v1/customers/:customerId/journey', getCustomerJourney);
router.get('/v1/visitors/:visitorId/journey', getVisitorJourney);

module.exports = router;
