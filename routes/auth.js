/* global UserExistsError */
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');
const { sanitizeBody } = require('express-validator/filter');
const normalizeUrl = require('normalize-url');
// const csrf = require('csurf');

// const csrfProtection = csrf({ cookie: true });

router.get('/register', /* skipAuth,*/ function(req, res) {
    res.render('auth/register', {
        title: 'Register - SBIR_Connector',
        errors: req.session.errors,
        fields: req.session.fields,
        // csrfToken: req.csrfToken()
    });
    req.session.errors = null;
    req.session.regsuccess = null;
});

router.post('/register',
    // sanitize all submissions
    sanitizeBody('username').trim().escape(),
    sanitizeBody('name').trim().escape(),
    sanitizeBody('email').trim().normalizeEmail({
        gmail_remove_subaddress: false,
        outlookdotcom_remove_subaddress: false,
        yahoo_remove_subaddress: false,
        icloud_remove_subaddress: false
    }),
    sanitizeBody('phone').trim().escape(),
    sanitizeBody('city').trim().escape(),
    sanitizeBody('affiliation').trim().escape(),
    sanitizeBody('profile').trim().escape(),
    sanitizeBody('link').trim().escape(),
    sanitizeBody('title').trim().escape(),
    async function(req, res){
        let sess = req.session;
        // Save all field entries into session to prefill if redirected
        // except for password
        sess.fields = Object.assign({}, req.body);
        delete sess.fields.password;
        delete sess.fields.passConf;
        
        // Check for existing email and username
        let emailQuery, usernameQuery;
        try {
            emailQuery = await User.findOne({email: req.body.email});
            usernameQuery = await User.findOne({username: req.body.username});
        } catch (err) {
            return res.status(500).render('error/500');
        }
        
        console.log(usernameQuery, emailQuery);
        // Validate rest of fields
        req.check('username')
            .notEmpty().withMessage('Username required')
            .custom(() => !usernameQuery).withMessage('Username already in use')
            .isAlphanumeric().withMessage('Username must be alphanumeric');

        req.check('email')
            .notEmpty().withMessage('Email required')
            .custom(() => !emailQuery).withMessage('Email already in use')
            .isEmail().withMessage('Invalid email address');

        req.check('password')
            .notEmpty().withMessage('Password required')
            .equals(req.body.passConf).withMessage('Passwords must match');

        req.check('name')
            .notEmpty().withMessage('Full name is required');

        if (req.body.phone) {
            req.check('phone')
                .isNumeric().withMessage('Invalid phone number');
        }
        if (req.body.link) {
            req.check('link')
                .isURL().withMessage('Invalid URL');
        }
        
        // if errors, redirect back to form 
        let errors = req.validationErrors();
        if (errors) {
            sess.errors = errors;
            return res.redirect('/register');
        }
        
        // otherwise, register user
        const newUserParams = {
            username: req.body.username,
            email: req.body.email,
            name: req.body.name,
            state:req.body.state,
            admin: false
        };
        
        // Check for optional fields and append to new user params
        if (req.body.phone)
            newUserParams.phone = req.body.phone;
        if (req.body.city)
            newUserParams.city = req.body.city;
        if (req.body.affiliation)
            newUserParams.affiliation = req.body.affiliation;
        if (req.body.profile)
            newUserParams.profile = req.body.profile;
        if (req.body.link)
            newUserParams.link = normalizeUrl(req.body.link, {forceHttp: true});
        if (req.body.title)
            newUserParams.title = req.body.title;
            
        const newUser = new User(newUserParams);
        User.register(newUser, req.body.password, (err/*, user*/) => {
            if (err) {
                let msg = 'Registration failed due to server error. Please try again later.';
                if (err instanceof UserExistsError) {
                    msg = 'Username already in use';
                }
                return res.render('auth/register', {
                    title: 'Register - SBIR_Connector',
                    errors: [{msg}]
                });
            }
            passport.authenticate('local')(req, res, function() {
                delete req.session.fields;
                res.redirect('/register?success=true');
            });
        });
    }
);


router.get('/login', skipAuth, (req, res) => {
    if (req.query.invalid) {
        req.flash('loginerror', 'Invalid username and/or password');
    }
    res.render('auth/login', {
        title: 'Login - SBIR_Connector',
        loginerrors: req.flash('loginerror')
    });
    req.session.errors = null;
});

router.post('/login', 
    sanitizeBody('username').trim().escape(),
    (req, res, next) => {
        req.check('username')
            .notEmpty().withMessage('Username required');

        req.check('password')
            .notEmpty().withMessage('Password required');

        let errors = req.validationErrors();

        if (errors) {
            req.session.errors = errors;
            return res.redirect('/login');
        }
        
        req.session.username = req.body.username;
        
        next();
    },
    passport.authenticate('local', {
        failureRedirect: '/login?invalid=true'
    }),
    (req, res) => {
        // workaround for session evaluating false immediately after login
        // https://github.com/jaredhanson/passport/issues/482#issuecomment-346928164
        req.session.save(() => res.redirect('/topics'));
    }
);

router.get('/logout', (req, res) => {
    // req.logout();
    req.session.cookie.expires = new Date(Date.now());
    req.session.destroy(() => {
        res.clearCookie('sbirsession');
        res.redirect('/?logout=true');
    });
    console.log('LOGGED OUT');
    console.log(req.session);
});

function skipAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/topics');
    }
    next();
}

module.exports = router;