// /**
//  * API route for handling database requests related to topics
//  */

// // let jwt = require('jsonwebtoken');
// let express = require('express');
// const config = require('../../config');
// let router = express.Router();

// /*Route to authenticate a user with a valid token*/
// router.post('/api/authenticate', function(req, res){

//     const pass = req.body.pass;
//     if(pass === 'catalystAdmin'){
//         const payload = {
//             admin: true
//         };
//         const token = jwt.sign(payload, config.secret, {
//             expiresIn: 86400 // expires in 24 hours
//         });
//         res.status(200).send({success:true, message:'Enjoy your token!', token:token});
//     }else{
//         res.status(401).send({success:false, message:'Failed authentication!', token:''});
//     }
// });

// module.exports = router;