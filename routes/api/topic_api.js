// /**
//  * API route for handling database requests related to topics
//  */
// const express = require('express');
// const router = express.Router();
// let config = require('../../config');
// const dynamo = require('../../dynamodb/DynamoDBHandler');

// router.put('/api/topic', function(req, res){
//     const params = {
//         TableName: 'SBIR_topics',
//         Key:{
//             'title': req.body.title,
//             'agency': req.body.agency
//         },
//         Item: {
//             'title': req.body.title,
//             'agency': req.body.agency,
//             'branch': req.body.branch,
//             'close_date': req.body.close_date,
//             'desc':req.body.desc,
//             'open_date':req.body.open_date,
//             'overview':req.body.overview,
//             'program':req.body.program,
//             'release_date':req.body.release_date,
//             'solicitation_link':req.body.solicitation_link,
//             'topic_number':req.body.topic_number,
//             'point_of_contact':req.body.point_of_contact
//         }
//     };
//     dynamo.putItem(params, function(err/*,data*/){
//         if(err){
//             console.error('Unable to put item into table. ERROR: ', JSON.stringify(err, null, 2));
//             return res.status(400).send({
//                 success:false,
//                 message:'Failed to put item'
//             });
//         } else{
//             console.log('Item put into table success');
//             return res.status(200).send({success:true, message:'Put item succeeded'});
//         }
//     });
// });

// router.get('/api/topic/all',function (req, res){
//     dynamo.scanTable({TableName: 'SBIR_topics'}, function(err, data){
//         if(err){
//             console.log('Error scanning table: ' + err.toString());
//             return res.status(500).send({success:false,  message:'Error encountered!', topics:null});
//         }
//         if(data === null){
//             return res.status(400).send({success:false, message:'Failed! Are you sending an authentication token?', topics:null});
//         }
//         return res.status(200).send({success:true, message:'Topic scan success', topics:data.Items});
//     });
// });

// module.exports = router;