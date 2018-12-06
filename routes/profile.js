const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { sanitizeBody } = require('express-validator/filter');
const User = require('../models/user');
const Topic = require('../models/topic');
const normalizeUrl = require('normalize-url');

router.get('/profile', function(req, res){
    res.redirect(`/profile/${req.user.username}`);
});

router.get('/profile/:username', async function(req, res){
    
    // check if profile is current user's profile
    const ownProfile = req.user.username === req.params.username;
    
    // get user for profile
    const {username} = req.params;
    let user;
    try {
        user = await User.findOne({username}, '-savedTopics');
    } catch (err) {
        return res.render('error/500');
    }
    
    if (!user) {
        return res.render('error/404');
    }
    
    // grab properties from retrieved user
    let {name, city, state, email, phone, link, affiliation, profile, title: userTitle} = user;
    
    if (link) {
        link = normalizeUrl(link, {forceHttp: true});
    }
    return res.render('profile/profile',{
        layout: 'profile_layout',
        title: `${name} - SBIR_Connector`,
        profileTab: true,
        username,
        name,
        userTitle,
        city,
        state,
        email,
        phone,
        link,
        affiliation,
        profile,
        ownProfile
    });
});

router.get('/profile/:username/listedtopics', async (req, res) => {
    const {username} = req.params;    
    const ownProfile = req.user.username === username;
    
    let user;
    try {
        user = await User.findOne({username: req.params.username}, 'username name title');
        // console.log(user);
    } catch (err) {
        return res.render('error/500');
    }
    
    if (!user) {
        return res.render('error/404');
    }
    
    const {name, title:userTitle} = user;
    
    let listedTopicsErr = false;
    let listedTopics;
    try {
        listedTopics = await Topic.find({listedUsers:user._id}, 'title');
        // console.log(listedTopics);
    } catch (error) {
        listedTopicsErr = true;
    }
    
    res.render('profile/listedTopics',{
        layout: 'profile_layout',
        title: `${name} - SBIR_Connector`,
        username,
        name,
        userTitle,
        listedTopics,
        listedTopicsErr,
        ownProfile
    });
});

router.get('/profile/:username/edit', async (req, res) => {
    const {username} = req.params;
    const ownProfile = req.user.username === username;
    
    
    if(!ownProfile) {
        return res.render('error/403');
    }
    
    let user;
    try {
        user = await User.findOne({username: req.params.username}, '-savedTopics');
    } catch (err) {
        return res.render('error/500');
    }
    
    if (!user) {
        return res.render('error/404');
    }
    // console.log(req);
    let {name, city, state, email, phone, link, affiliation, profile, title: userTitle} = user;
    res.render('profile/profileedit', {
        layout: 'profile_layout',
        title: `${name} - SBIR_Connector`,
        editProfile: true,
        username,
        name,
        userTitle,
        city,
        state,
        email,
        phone,
        link: normalizeUrl(link),
        affiliation,
        profile,
        ownProfile,
        passErr: req.flash('passErr'),
        success: req.flash('success'),
        errors: req.session.errors
    });
    req.session.errors = null;
});

router.get('/profile/:username/bookmarks', async (req, res) => {
    const {username} = req.params;
    const ownProfile = req.user.username === username;


    if(!ownProfile) {
        return res.render('error/403');
    }

    let user;
    try {
        user = await User.findOne({username: req.params.username}, 'name title savedTopics');
        console.log(user);
    } catch (err) {
        return res.render('error/500');
    }
    
    const {name, title:userTitle} = user;    
    
    let savedTopicsErr = false;
    let savedTopics;
    try {
        savedTopics = await Topic.find({_id: {$in: user.savedTopics.map(id => mongoose.Types.ObjectId(id))}});
    } catch (error) {
        savedTopicsErr = true;
    }
    
    res.render('profile/bookmarks',{
        layout: 'profile_layout',
        title: `${name} - SBIR_Connector`,
        bookmarksTab: true,
        username,
        name,
        userTitle,
        savedTopics,
        savedTopicsErr,
        errors: req.session.errors,
        ownProfile
    });
});

router.post('/profile/edit',
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
    sanitizeBody('link').trim(),  
    async (req, res) => {
        let emailQuery;
        try {
            emailQuery = await User.findOne({email: req.body.email});            
        } catch (err) {
            res.status(500).send('500 Internal Server Error');
        }
        req.check('name')
            .notEmpty().withMessage('Full name is required');
        
        req.check('email')
            .notEmpty().withMessage('Email required')
            .custom(() => !emailQuery || req.user.username === emailQuery.username).withMessage('Email already in use')
            // if (emailQuery) {
            //     if (req.user.username === emailQuery.username) {
            //         return true;
            //     } else {
            //         return false;
            //     }
            // } else {
            //     return true;
            // }} )
            .isEmail().withMessage('Invalid email address');

        if (req.body.phone) {
            req.check('phone')
                .isNumeric().withMessage('Invalid phone number');
        }
        if (req.body.link) {
            req.check('link')
                .isURL().withMessage('Invalid URL');
        }
        
        const updatedUser = Object.assign({}, req.body);
        // console.log(updatedUser);
        try {
            await User.findOneAndUpdate({_id: req.user._id}, updatedUser);
        } catch (error) {
            res.status(500).send('500 Internal Server Error: Update failed');            
        }
        
        const {username} = req.user;
        req.flash('success', 'Changes saved successfully');
        req.session.save(err => {
            if (err) {
                console.error(err);
            }
            res.redirect(`/profile/${username}/edit`);
        });
    }
);

router.post('/profile/changepassword', 
    async (req, res) => {
        let user;
        try {
            user = await User.findById(req.user._id);
        } catch (error) {
            return res.render('error/500');
        }
        
        if (!user) {
            console.log('Bad user');
            return res.render('error/404');
        }
        
        // console.log(req.get('origin'));
        // Check password, handle incorrect password or 500 on server error
        user.authenticate(req.body.currPassword, async (err, model, passwordError) => {
            if (err){
                console.error(err);
                return res.render('error/500');
            }    
            else if (passwordError) {
                console.error(passwordError);
                console.error(`Invalid password: ${req.body.currPassword}`);
                req.flash('passErr', 'Incorrect password');
                return res.redirect(req.get('referer'));
            }
            else {
                req.check('newPassword')
                    .notEmpty().withMessage('Password required')
                    .equals(req.body.newPasswordConf).withMessage('New passwords must match');

                let errors = req.validationErrors();
                if (errors) {
                    req.flash('passErr', 'New passwords must match');
                    return res.redirect(req.get('referer'));
                }
                
                try {
                    await user.setPassword(req.body.newPassword);
                    user.save();
                    req.flash('success', 'Password changed successfully');
                    req.session.save(err => {
                        if (err)
                            console.error(err);
                        return res.redirect(`/profile/${req.user.username}/edit`);
                    });
                } catch (error) {
                    console.error(error);
                    return res.render('error/500');
                }
            }
        });
        
    });

module.exports = router;