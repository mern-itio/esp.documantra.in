const SmtpConfiguration = require('../models/SmtpConfiguration');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const email = require('../services/email.service');

const createSmtpConfig = async (req, res) => {
  try {
    const userId = req?.user?.data?.id;
    const payload = req.body;

    const smtpConfig = await SmtpConfiguration.create({
      userId,
      provider: payload.provider,
      displayName: payload.displayName,
      fromName: payload.fromName,
      fromEmail: payload.fromEmail,
      smtp: payload.smtp,
      credentials: payload.credentials,
      isDefault: payload.isDefault || false
    });

    // If set as default → unset previous defaults
    if (payload.isDefault) {
      await SmtpConfiguration.updateMany(
        { userId, _id: { $ne: smtpConfig._id } },
        { $set: { isDefault: false } }
      );
    }

    return res.status(201).json({
      success: true,
      data: smtpConfig
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
const getSmtpConfigs  = async (req, res) => {
    try {
    const userId = req?.user?.data?.id;

    const configs = await SmtpConfiguration.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 });

    return res.json({
      success: true,
      data: configs
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
const updateSmtpConfig  = async (req, res) => {
      try {
    const userId = req?.user?.data?.id;
    const { id } = req.params;

    if (!(id)) {
      return res.status(400).json({ success: false, message: 'Config ID is required.' });
    }

    const smtpConfig = await SmtpConfiguration.findOneAndUpdate(
      { _id: id, userId },
      { $set: req.body },
      { new: true }
    );

    if (!smtpConfig) {
      return res.status(404).json({
        success: false,
        message: 'SMTP configuration not found'
      });
    }

    // Handle default switch
    if (req.body.isDefault === true) {
      await SmtpConfiguration.updateMany(
        { userId, _id: { $ne: smtpConfig._id } },
        { $set: { isDefault: false } }
      );
    }

    return res.json({
      success: true,
      data: smtpConfig
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
const setDefaultSmtpConfig  = async (req, res) => {
  try {
    const userId = req?.user?.data?.id;
    const { id } = req.params;

    const smtpConfig = await SmtpConfiguration.findOne({
      _id: id,
      userId
    });

    if (!smtpConfig) {
      return res.status(404).json({
        success: false,
        message: 'SMTP configuration not found'
      });
    }

    // Remove default from others
    await SmtpConfiguration.updateMany(
      { userId },
      { $set: { isDefault: false } }
    );

    smtpConfig.isDefault = true;
    await smtpConfig.save();

    res.json({
      success: true,
      message: 'Default SMTP configuration set',
      data: smtpConfig
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
const deleteSmtpConfig  = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const smtpConfig = await SmtpConfiguration.findOneAndDelete({
      _id: id,
      userId
    });

    if (!smtpConfig) {
      return res.status(404).json({
        success: false,
        message: 'SMTP configuration not found'
      });
    }

    return res.json({
      success: true,
      message: 'SMTP configuration deleted'
    });

  } catch (err) {
   return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

const testSmtpConfig = async (req, res) => {
      try {
        const userId = req?.user?.data?.id;
        const { id } = req.params;
        console.log(id);
        const { testEmail } = req.body; // optional
    
        const smtpConfig = await SmtpConfiguration.findOne({ _id: id, userId });
        console.log(smtpConfig);
    
        if (!smtpConfig) {
          return res.status(404).json({
            success: false,
            message: 'SMTP configuration not found'
          });
        }
    
        const transporter = nodemailer.createTransport({
          host: smtpConfig.smtp.host,
          port: smtpConfig.smtp.port,
          secure: smtpConfig.smtp.secure,
          auth: {
            user: smtpConfig.fromEmail,
            pass: smtpConfig.credentials.password
          },
          tls: {
            rejectUnauthorized: false // helps with bad webmail certs
          }
        });
    
        // Verify connection (auth + SMTP handshake)
        await transporter.verify();
    
        // Send test email
        await transporter.sendMail({
          from: `"${smtpConfig.fromName || 'SMTP Test'}" <${smtpConfig.fromEmail}>`,
          to: testEmail || smtpConfig.fromEmail,
          subject: 'SMTP Configuration Test Successful',
          text: 'Your SMTP configuration is working correctly.'
        });
    
        smtpConfig.isVerified = true;
        smtpConfig.lastTestedAt = new Date();
        smtpConfig.lastError = null;
        await smtpConfig.save();
    
        return res.json({
          success: true,
          message: 'SMTP test successful'
        });
    
      } catch (error) {
        // Save failure reason
        await SmtpConfiguration.findByIdAndUpdate(req.params.id, {
          isVerified: false,
          lastTestedAt: new Date(),
          lastError: error.message
        });
    
        return res.status(400).json({
          success: false,
          message: 'SMTP test failed',
          error: error.message
        });
      }
}
const sendMail = async (req, res) =>{
  const { toEmail, subject, html,attachments } = req.body;
  try {
    const userId = req.params.id;
    const response = await email.sendEmailByUserId({ userId, toEmail, subject, html,attachments });
    return res.json({   
      success: true,
      message: 'Email sent successfully',
      sentTo: toEmail
    });
  }catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
const sendMailBySystem = async (req, res) =>{
const {to, subject, html, attachments} = req.body;
  try{
    if(!to || !subject || !html){
      return res.status(400).json({
        success: false,
        message: 'toEmail, subject and html are required fields'
      });
    }
    const response = await email.sendEmailBySystem({ to, subject, html, attachments });
      console.log(response);
      return res.json({   
        success: true,
        message: 'Email sent successfully',
        sentTo: to
      });
  }catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    }); 
  }
}
module.exports = { createSmtpConfig, getSmtpConfigs, updateSmtpConfig, setDefaultSmtpConfig, deleteSmtpConfig,testSmtpConfig,sendMail,sendMailBySystem };