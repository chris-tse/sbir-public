const express = require('express');
const router = express.Router();
const dynamo = require('../dynamodb/DynamoDBHandler');
const bcrypt = require('bcryptjs');
const { sanitizeBody } = require('express-validator/filter');

router.get('/register', function(req, res) {
    console.log(req.session);
    res.render('register', {
        title: 'Register - SBIR_Connector',
        errors: req.session.errors,
        fields: req.session.fields,
        regsuccess: req.session.regsuccess,
        badinput: req.session.badinput
    });
    req.session.badinput = null;
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
    sanitizeBody('link').trim(),
    
    async function(req, res){
        let sess = req.session;
        try {
            
            
            let usernameGet, emailQuery;
            
            try {
                usernameGet = await dynamo.getItemWithPromise({
                    TableName: 'SBIR_users',
                    Key: {
                        'username': req.body.username
                    }
                });
                emailQuery = await dynamo.queryWithPromise({
                    TableName: 'SBIR_users',
                    IndexName: 'email-index',
                    KeyConditionExpression: 'email = :email_val',
                    ExpressionAttributeValues: { ':email_val': req.body.email } 
                });
            } catch (err) {
                console.log('❌❌❌');
                sess.badinput = true;
                return res.redirect('/register');
            }            
            console.log('Kept going');
            // Validate fields
            req.check('username')
                .notEmpty().withMessage('Username required')
                .custom(() => !Object.keys(usernameGet).length).withMessage('Username already in use')
                .isAlphanumeric().withMessage('Username must be alphanumeric');
                        
            req.check('email')
                .notEmpty().withMessage('Email required')
                .custom(() => !emailQuery.Count).withMessage('Email already in use')
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
            
            let errors = req.validationErrors();
            
            // Save current entries in case of failure
            sess.fields = Object.assign({}, req.body);
            delete sess.fields.password;
            delete sess.fields.passConf;
            
            console.log('ERRORS:', errors);
            if (errors) {
                sess.errors = errors;
                return res.redirect('/register');
            } else {
                const hash = await hashPasswordWithSalt(req.body.password);
                if(hash){
                    const params = {
                        TableName: 'SBIR_users',
                        Key: {
                            'username': req.body.username
                        },
                        Item: {
                            'username': req.body.username,
                            'email': req.body.email,
                            'password': hash,
                            'name': req.body.name,
                            'phone':req.body.phone || 'NULL',
                            'city': req.body.city || 'NULL',
                            'state':req.body.state,
                            'affiliation':req.body.affiliation || 'NULL',
                            'profile':req.body.profile || 'NULL',
                            'link':req.body.link || 'NULL',
                            'admin': false
                        }
                    };
                    try {
                        await dynamo.putItemWithPromise(params);
                        sess.regsuccess = true;
                        res.status(201).redirect('/register');
                    }catch(err){
                        console.log('Error encountered registering:' + err.toString());
                        sess.regsuccess = false;
                        res.status(500).redirect('/register');
                    }
                }
            }
        } catch (err) {
            sess.badinput = true;
            return res.redirect('/register');
        }
    }
);

/**
 * Returns a hash with a salt from the given string. Returns null if an error occurs.
 * @param password Plain text password
 * @returns {Promise<*>}
 */
async function hashPasswordWithSalt(password){
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }catch(err){
        console.log('Error creating hash!' + err.toString());
        return null;
    }
}

module.exports = router;