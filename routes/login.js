const express = require('express');
const router = express.Router();
const dynamo = require('../dynamodb/DynamoDBHandler');
const config = require('../config');
const bcrypt = require('bcryptjs');
const { sanitizeBody } = require('express-validator/filter');

router.get('/login', async function(req, res) {
    // console.log(req.session);
    // let data = await dynamo.queryWithPromise({
    //     TableName: 'SBIR_users',
    //     IndexName: 'email-index',
    //     KeyConditionExpression: 'email = :email_val',
    //     ExpressionAttributeValues: { ':email_val': 'christse@ou.edu' } 
    // });
    // console.log(data);
    // .then(data => console.log(Boolean(data)));
    res.render('login', {
        title: 'Login - SBIR_Connector',
        errors: req.session.errors,
        badinput: req.session.badinput
    });
    
    req.session.errors = null;
    req.session.badinput = null;
});

router.post('/login', 

    sanitizeBody('username').trim().escape(),
    sanitizeBody('password').trim().escape(),
    
    async function(req, res){
        try {
            req.check('username')
                .notEmpty().withMessage('Username required');
                
            req.check('password')
                .notEmpty().withMessage('Password required');
                
            let errors = req.validationErrors();
            
            if (errors) {
                req.session.errors = errors;
                return res.redirect('/login');
            }
            
            const data = await dynamo.getItemWithPromise({
                TableName: 'SBIR_users',
                Key:{
                    'username': req.body.username
                }
            });
            
            let success = false;
            
            if(data.Item) {
                const isSame = await bcrypt.compare(req.body.password, data.Item.password);
                if (isSame)
                    success = true;
            }
            
            if (success) {
                req.session.username = req.body.username;
                console.log(req.session);
                res.status(200).redirect('/topics');
            } else {
                req.session.errors = [{msg: 'Invalid username or password'}];
                res.status(401).redirect('/login');
            }
        } catch (err) {
            req.session.badinput = true;
            res.redirect('/login');
        }
    }
);

router.post('/profile/favorite', async function(req, res){
    console.log(req.body);
    try {
        let topicKey = [{title:req.body.keytitle, agency:req.body.keyagency}];
        let decodedData = jwt.verify(req.body.token, config.secret);
        console.log(decodedData);
        let person = await dynamo.getItemWithPromise({
            TableName: 'SBIR_users',
            Key: {
                'email': decodedData.email
            }
        });

        let updateParams = {
            TableName: 'SBIR_users',
            Key: {
                'email': decodedData.email
            },
            UpdateExpression: 'set topicKeys = list_append(topicKeys,:k)',
            ExpressionAttributeValues:{
                ':k':topicKey
            },
            ReturnValues: 'UPDATED_NEW'
        };
        if(person.Item.topicKeys){
            for(let tk in person.Item.topicKeys){
                if(JSON.stringify(person.Item.topicKeys[tk]) === JSON.stringify(topicKey[0])){
                    console.log('Found duplicate topic key');
                    //Delete key because user unfavorited
                    updateParams.UpdateExpression = 'remove topicKeys[' + tk + ']';
                    updateParams.ExpressionAttributeValues = undefined;
                    break;
                }
            }
        }else{
            updateParams.UpdateExpression = 'set topicKeys = :k';
        }
        let updateUser = await dynamo.updateWithPromise(updateParams);
        if(updateUser.Attributes){
            return res.status(201).send({success:true, message:'Added to favorites list'});
        }
        return res.status(200).send({success:true, message:'Removed from favorites list'});
    }catch(err){
        console.log(err);
        if(err.name === 'TokenExpiredError'){
            return res.status(401).send({success:false, message:'Expired token!'});
        }else{
            return res.status(400).send({success:false, message:'Internal server error'});
        }
    }
});

// router.post('/verifytoken', function(req, res){
//     console.log('Verifying token');
//     jwt.verify(req.body.token, config.secret, function(err/*, decoded*/){
//         if(err){
//             res.status(401).send({success:false, message:'Token not verified!'});
//         }else{
//             res.status(200).send({success:true, message:'Token verified'});
//         }
//     });
// });

//Create page that destroys local storage token
// router.get('/logout', function(req, res){
//     res.redirect('/login');
// });


/**
 * Returns a token with admin rights if applicable
 * @param userData Request body representing user table data.
 * @returns {String}
 */
function getToken(userData){
    let isAdmin = false;
    console.log(userData.name);
    //Check if the user has an admin field, and if they are an admin.
    if(userData.admin){
        isAdmin = userData.admin;
    }
    const payload = {
        admin: isAdmin,
        name: userData.name,
        email:userData.email
    };
    return jwt.sign(payload, config.secret, {
        expiresIn: 86400 * 7// expires in 7 days
    });
}



module.exports = router;