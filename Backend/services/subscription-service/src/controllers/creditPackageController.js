
const CreditPackage = require('../models/CreditPackage');
const flexibleCreditPackage = require('../models/flexibleCreditPackage');
const Stripe = require('stripe');
const {createInvoiceForCreditPurchase,createInvoiceForFlexiCreditPurchase} = require('../controllers/invoiceController');
const Subscription = require('../models/Subscription');
const { validateCreditPackagePayload } = require('../utils/billingValidation');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}
const getUserIdFromRequest = (req) => {
  // auth-lib attaches full decoded token to req.user
  // Our auth tokens embed user data under data: { id, email, fullname }
  const decoded = req.user || {};
  return decoded?.data?.id || decoded?.id || decoded?._id || decoded?.data?._id || null;
};
const getUserEmailFromRequest = (req) => {
  const decoded = req.user || {};
  return decoded?.data?.email || decoded?.email || null;
};
const listCreditPackages = async (req, res) => {
  try {
    const creditPackages = await CreditPackage.find();
     return res.status(200).json(creditPackages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCreditPackage = async (req, res) => {
  try {
    const validation = validateCreditPackagePayload(req.body || {});
    if (!validation.ok) {
      return res.status(400).json({ status: 400, message: validation.message, data: null });
    }

    const creditPackage = new CreditPackage(validation.sanitized);
    await creditPackage.save();
    return res.status(201).json(creditPackage);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid request' });
  }
};

const getCreditPackage = async (req, res) => {
  try {
    const creditPackage = await CreditPackage.findById(req.params.id);
    if (!creditPackage) {
      return res.status(404).json({ message: 'Credit package not found' });
    }
    res.json(creditPackage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCreditPackage = async (req, res) => {
  try {
    const validation = validateCreditPackagePayload(req.body || {}, { isUpdate: true });
    if (!validation.ok) {
      return res.status(400).json({ status: 400, message: validation.message, data: null });
    }

    const creditPackage = await CreditPackage.findByIdAndUpdate(
      req.params.id,
      validation.sanitized,
      { new: true, runValidators: true }
    );
    if (!creditPackage) {
      return res.status(404).json({ message: 'Credit package not found' });
    }
    return res.status(200).json(creditPackage);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid request' });
  }
};

const deleteCreditPackage = async (req, res) => {
  try {
    const creditPackage = await CreditPackage.findByIdAndDelete(req.params.id);
    if (!creditPackage) {
      return res.status(404).json({ message: 'Credit package not found' });
    }
    return res.status(200).json({ message: 'Credit package deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }
      const { creditPackageId } = req.body;
    if (!creditPackageId) {
      return res.status(400).json({ status: 400, message: 'creditPackageId is required', data: null });
    }
    const creditPackage = await CreditPackage.findById(creditPackageId);
    if (!creditPackage) {
      return res.status(404).json({ status: 404, message: 'Credit package not found', data: null });
    }
    const amount = Math.round(creditPackage.price * 100); // Convert to smallest currency unit
    const currency = String(creditPackage.currency || 'INR').trim().toLowerCase() || 'inr';
    const frontendBase = process.env.FRONTEND_BASE_URL ||
      process.env.BASE_URL ||
      'https://esp.documantra.in/';
    const userEmail = getUserEmailFromRequest(req);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: `${creditPackage.name}`,
              description: `Purchase ${creditPackage.credits} credits for your account`
            }
          },
          quantity: 1
        },
      ],
      metadata: {
        userId: String(userId),
        creditPackageId: String(creditPackageId),
      },
      success_url: `${frontendBase.replace(/\/$/, '')}/subscription-management?credit_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBase.replace(/\/$/, '')}/subscription-management?canceled=true`,
    });
    return res.status(200).json({
      status: 200,
      message: 'Stripe checkout session created',
      data: { id: session.id, url: session.url },
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const createFlexCheckoutSession = async (req, res)=>{
 const {creditPackageId,desiredCreditPricing,desiredCredits} = req.body;
//  console.log(creditPackageId);
//  console.log(desiredCreditPricing);
//  console.log(desiredCredits);
 try{
    if(!stripe){
      return res.status(500).json({ message: 'Stripe is not configured' });
    }
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }
    if (!creditPackageId) {
      return res.status(400).json({ status: 400, message: 'creditPackageId is required', data: null });
    }
    if (!desiredCredits || Number(desiredCredits) <= 0) {
      return res.status(400).json({ status: 400, message: 'desiredCredits must be greater than 0', data: null });
    }
    if (!desiredCreditPricing || Number(desiredCreditPricing) <= 0) {
      return res.status(400).json({ status: 400, message: 'desiredCreditPricing must be greater than 0', data: null });
    }
    const flexiblePackage = await flexibleCreditPackage.findById(creditPackageId);
    if(!flexiblePackage){
      return res.status(404).json({ status: 404, message: 'Flexible Credit package not found', data: null });
    }
    const amount = Math.round(Number(desiredCreditPricing) * 100);
    const currency = String(flexiblePackage?.currency || 'INR').trim().toLowerCase() || 'inr';
    const frontendBase = process.env.FRONTEND_BASE_URL ||
      process.env.BASE_URL ||
      'https://esp.documantra.in/';
    const userEmail = getUserEmailFromRequest(req);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: `${flexiblePackage.name}`,
              description: `Purchase ${desiredCredits} credits for your account`
            }
          },
          quantity: 1
        },
      ],
      metadata: {
        userId,
        creditAdded: String(desiredCredits),
        creditPricing: String(desiredCreditPricing),
        creditPackageId
      },
      success_url: `${frontendBase.replace(/\/$/, '')}/subscription-management?flexible_credit_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBase.replace(/\/$/, '')}/subscription-management?canceled=true`,
    });
    return res.status(200).json({
      status: 200,
      message: 'Stripe checkout session created',
      data: { id: session.id, url: session.url },
    });

 }catch (err){
  console.log(err);
  return res.status(500).json({status:500,success:false,message:"Inernal server error"});
 }
};

const confirmCheckoutSession = async (req, res) =>{
  try{
    // console.log("Confirming Session");
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }
    const { creditSessionId } = req.body;
    // console.log('Credit Session Id', creditSessionId);
    if (!creditSessionId) {
      return res.status(400).json({ status: 400, message: 'Credit Session Id is required', data: null });
    }
    const session = await stripe.checkout.sessions.retrieve(creditSessionId);
    if(!session){
      return res.status(404).json({ status: 404, message: 'Session not found', data: null });
    }
    if(session.payment_status !== 'paid'){
      return res.status(400).json({ status: 400, message: 'Payment not completed', data: null });
    }
    const metadata = session.metadata || {};
    if (metadata.userId && String(metadata.userId) !== String(userId)) {
      return res.status(403).json({ status: 403, message: 'Forbidden', data: null });
    }
    const {creditPurchased, invoice } = await applyCreditsToUser(metadata.creditPackageId, userId);
    return res.status(200).json({ 
      status: 200, 
      message: 'Payment confirmed and credits applied', 
      data: { creditPurchased, invoice } 
    });
  }catch (error){
    console.error('confirmCheckoutSession error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ status: statusCode, message: error.message || 'Server error', data: null });
  }
}
const flexiConfirmCheckoutSession = async(req, res)=>{
  try{
    // console.log("Confirming Session");
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }
    const creditSessionId = req?.body?.flexiSessionId;

    // console.log('Credit Session Id', creditSessionId);
    if (!creditSessionId) {
      return res.status(400).json({ status: 400, message: 'Credit Session Id is required', data: null });
    }
    const session = await stripe.checkout.sessions.retrieve(creditSessionId);
    if(!session){
      return res.status(404).json({ status: 404, message: 'Session not found', data: null });
    }
    if(session.payment_status !== 'paid'){
      return res.status(400).json({ status: 400, message: 'Payment not completed', data: null });
    }
    const metadata = session.metadata || {};
    if (metadata.userId && String(metadata.userId) !== String(userId)) {
      return res.status(403).json({ status: 403, message: 'Forbidden', data: null });
    }
    const {creditPurchased, invoice } = await applyFlexiCreditsToUser(metadata, userId);
    return res.status(200).json({ 
      status: 200, 
      message: 'Payment confirmed and credits applied', 
      data: { creditPurchased, invoice } 
    });
  }catch (error){
    console.error('flexiConfirmCheckoutSession error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ status: statusCode, message: error.message || 'Server error', data: null });
  }
}
const applyFlexiCreditsToUser = async (metadata,userId) =>{
  const flexiPackage = await flexibleCreditPackage.findById(metadata?.creditPackageId);
  if (!flexiPackage) {
    const error = new Error('Credit package not found');
    error.statusCode = 404;
    throw error;
  }
  const subscription = await Subscription.findOne({ userId }) || await Subscription.create({
    userId,
    creditsBalance: 0,
    status: 'active',
  });
  subscription.creditsBalance += Number(metadata.creditAdded);
  await subscription.save();
  const creditResponse = {
    creditsAdded: Number(metadata.creditAdded),
    totalCredits: subscription.creditsBalance
  };
  let invoice = null;
  try{
      invoice  = await createInvoiceForFlexiCreditPurchase(userId, flexiPackage,metadata);
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
    return { creditPurchased: creditResponse, invoice };
}
const applyCreditsToUser = async (creditPackageId, userId) => {
  const creditPackage = await CreditPackage.findById(creditPackageId);
  if (!creditPackage) {
    const error = new Error('Credit package not found');
    error.statusCode = 404;
    throw error;
  }
  const subscription = await Subscription.findOne({ userId }) || await Subscription.create({
    userId,
    creditsBalance: 0,
    status: 'active',
  });
  subscription.creditsBalance += creditPackage.credits;
  await subscription.save();
  const creditResponse = {
    creditsAdded: creditPackage.credits,
    totalCredits: subscription.creditsBalance,
  };
  let invoice = null;
  try{
    invoice  = await createInvoiceForCreditPurchase(userId, creditPackage);
  } catch (error) {
    console.error('Error creating invoice:', error);
  }
  return { creditPurchased: creditResponse, invoice };
}
const getFlexiblePackage = async (req, res) => {
  try {
    const flexiblePackage = await flexibleCreditPackage.findOne();

    if (!flexiblePackage) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Flexible package not found"
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Flexible package fetched successfully",
      data: flexiblePackage
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error."
    });
  }
};
module.exports = {
  createCheckoutSession,
  confirmCheckoutSession,
  listCreditPackages,
  createCreditPackage,
  getCreditPackage,
  updateCreditPackage,
  deleteCreditPackage,
  getFlexiblePackage,
  createFlexCheckoutSession,
  flexiConfirmCheckoutSession
};