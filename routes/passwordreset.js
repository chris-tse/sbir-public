const express = require('express');
const router = express.Router();
const User = require('../models/user');
const nodemailer = require('nodemailer');
const cryptoRandomString = require('crypto-random-string');

router.get('/forgotpassword', (req, res) => {
    res.render('auth/forgotpassword');
});

router.post('/forgotpassword', async (req, res) => {
    console.log(req.body);
    let {email} = req.body;
    let user;
    try {
        user = await User.findOne({email}, 'username');
    } catch (error) {
        return res.status(500).json({success: false});
    }
    
    if (!user) {
        return res.json({success: false});
    }
    
    const newPassword = cryptoRandomString(15);
    console.log('New generated password: ' + newPassword);
    try {
        await user.setPassword(newPassword);
        user.save();
    } catch (error) {
        return res.status(500).json({success: false});
    }
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'okcatalysts@gmail.com',
            pass: '#Innovation!'
        } 
    });
    
    let mailOptions = {
        from: 'SBIR Connector <okcatalysts@gmail.com>',
        to: email,
        subject: 'Account Password Reset',
        html: `
            <h1>SBIR Connector Password Reset</h1>
            <p>A password reset request has been sent to this account. We have reset it to a temporary one. Please use this new password below to log into your account and set a new one.</p>
            <ul>
                <li>Username: ${user.username}</li>
                <li>Password: ${newPassword}</li>
            </ul>
            <p>Log in at <a href="https://sbirconnector.com/login">https://sbirconnector.com/login</a> then go to the "Edit Profile" section in your profile page to change your password.</p>
            <p>© 2018 OK Catalyst</p>
        `
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.status(500).json({success: false});
        } else {
            console.log('Email sent: ' + info.response);
            res.json({success: true});
        }
    });
    
    
});

module.exports = router;