const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const csurf = require('csrf');

router.get('/', function(req, res) {
    // console.log(res.locals.session);
    // console.log(req.session);
    res.render('index', {
        title: 'Home - SBIR_Connector',
        logout: req.query.logout
    });
});

router.get('/passchangeredirect', (req, res) => {
    if (req.query.redirect === undefined) {
        return res.redirect('/profile');
    } else {
        res.redirect(req.query.redirect);
    }
});

router.post('/contact', (req, res) => {
    console.log(req.body);
    const {name, email, subject, message} = req.body;
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'okcatalysts@gmail.com',
            pass: '#Innovation!'
        } 
    });
    
    let mailOptions = {
        from: 'Contact Form Submission <okcatalysts@gmail.com>',
        to: 'sbir@ou.edu',
        subject: `Submission from ${name}`,
        html: `
            <h1>SBIR Connector Contact Form Submission</h1>
            <p>A new submission has been received from the contact form on the SBIR Connector website:</p>
            <ul>
                <li>Name: ${name}</li>
                <li>Email: ${email}</li>
                <li>Subject: ${subject}</li>
                <li>Message: ${message}</li>
            </ul>
            <hr>
            <p>© 2018 OK Catalyst</p>
        `
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.error(error);
            res.status(500).json({success: false});
        } else {
            console.log('Email sent: ' + info.response);
            res.json({success: true});
        }
    });
});

module.exports = router;