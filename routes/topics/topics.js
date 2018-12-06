const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Topic = require('../../models/topic');
const User = require('../../models/user');

const idToString = id => id.toString();

/* GET list of topics and render page. /topics/:page */
router.get('/topics', async function (req, res) {
    // console.log(req.session);
    // Check for invalid page value. Set to 1 if invalid
    let page = parseInt(req.query.page);
    // console.log(req.query.keywords);
    if (page === undefined || Number.isNaN(page) || page < 1)
        page = 1;
    
    // /topics?keywords=term1+term2&agency[]=agency1&agency[]=agency2
    // Initialize empty search query and search conditions array
    let query = {};
    let programSearch = [];
    let keywordSearch = [];
    let agencySearch = [];
    let branchSearch = [];
    // console.log(req.query.keywords);
    if (req.query.keywords) {
        let keywords = req.query.keywords
            .split(' ')
            .map(str => `(?=.*${str})`)
            .join('');
            
        let regex = '^' + keywords + '.*$';
        console.log(regex);
        keywordSearch.push({title: new RegExp(regex, 'im')});
        keywordSearch.push({desc: new RegExp(regex, 'im')});
    }
    
    if (req.query.program) {
        let programs = req.query.program;
        if (!Array.isArray(programs)) {
            programs = [programs];
        }
        programs.forEach(program => programSearch.push({program}));
    }
    
    if (req.query.agency) {
        let agencies = req.query.agency;
        if (!Array.isArray(agencies)) {
            agencies = [agencies];
        }
        agencies.forEach(agency => agencySearch.push({agency}));
    }
    
    if (req.query.branch) {
        let branches = req.query.branch;
        if (!Array.isArray(branches)) {
            branches = [branches];
        }
        branches.forEach(branch => branchSearch.push({branch}));
    }
    
    // query should (match regex in title OR body) AND (agency1 OR agency2 OR ... agencyn)  
    let urlString = '';
    if (keywordSearch.length > 0) {
        if (!query['$and'])
            query = {'$and': []};
        query['$and'].push({'$or': keywordSearch});
        urlString += `keywords=${req.query.keywords.split(' ').join('+')}&`;
    }
    
    if (agencySearch.length > 0) {
        if (!query['$and'])
            query = {'$and': []};
        query['$and'].push({'$or': agencySearch});
        agencySearch.forEach(agency => urlString += `agency=${agency.agency}&`);
    }
    
    if (branchSearch.length > 0) {
        if (!query['$and'])
            query = {'$and': []};
        query['$and'].push({'$or': branchSearch});
        branchSearch.forEach(branch => urlString += `branch=${branch.branch}&`);
    }
    
    if (programSearch.length > 0) {
        if (!query['$and'])
            query = {'$and': []};
        query['$and'].push({'$or': programSearch});
        programSearch.forEach(program => urlString += `program=${program.program}&`);
    }
    
    // console.log(JSON.stringify(query));
    
    Topic.paginate(query, {page, limit: 10}, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        // console.log(result.docs[0]);
        res.render('topics_list',{
            title: 'Topics - SBIR_Connector',
            topics: result.docs,
            pagination: {
                page,
                pageCount: result.pages
            },
            urlString
        });
    });
    
    
    // const params = {
    //     TableName: 'SBIR_topics', 
    //     Limit: 10, 
    //     ExclusiveStartKey: page > 1 ? paginationKeys[(page - 1)] : null
    // };
    
    // dynamo.scanTable(params, function(err, data){
    //     // console.log(paginationKeys);
        
    //     res.render('topics_list',{
    //         title: 'Topics - SBIR_Connector',
    //         topics: data.Items,
    //         pagination: {
    //             page,
    //             pageCount
    //         }

    //     });
    // });
});



router.get('/topics/:id', async function(req, res) {
    const topicId = req.params.id;
    let topic, isSaved, isListed;
    try {
        topic = await Topic.findById(topicId);
        let user = await User.findById(req.user._id);
        isSaved = user.savedTopics.map(idToString).includes(topicId);
        isListed = topic.listedUsers.map(idToString).includes(req.user._id.toString());
    } catch(err) {
        console.error(`Path: ${req.url}`);
        console.error(`${err.message}`);
        return res.render('404');
    }

    const {
        title: topicTitle,
        agency,
        branch,
        program,
        topicNumber,
        solicitationLink,
        point_of_contact,
        releaseDate,
        openDate,
        closeDate,
        desc: description,
        listedUsers,
    } = topic;
    
    let users;
    try {
        users = await User.find({_id: {$in: listedUsers.map(id => mongoose.Types.ObjectId(id))}});  
    } catch(err) {
        console.error(err);
    }
    
    res.render('topic_details', {
        layout: 'details_layout',
        title: `SBIR Connector - ${topicTitle}`,
        topicTitle,
        agency,
        branch,
        program,
        topicNumber,
        solicitationLink,
        point_of_contact,   
        releaseDate,
        openDate,
        closeDate,
        description,
        users,
        isSaved,
        isListed
    });
});

router.post('/topics/:id/savetopic', async function(req, res) {
    const topicId = req.params.id;
    
    try {
        let user = await User.findById(req.user._id);
        console.log('Got user');
        console.log(user);
        
        let savedTopics = user.savedTopics.map(idToString);

        let add = true;
        if (savedTopics.includes(topicId)) {
            add = false;
            console.log('Removing topic from saved list');
            user.savedTopics = user.savedTopics.map(idToString).filter(id => id !== topicId);
        } else {
            // add user to list
            console.log('Adding topic to saved list');
            user.savedTopics.push(topicId);
        }

        user.save(function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send({});
            }
            let message = add ? 'Added topic to saved list' : 'Removed topic from saved list';
            res.status(200).send({message});
        });
    } catch(err) {
        console.error(err);
    }
    
});

router.post('/topics/:id/listuser', async function(req, res) {
    const topicId = req.params.id;
    const userId = req.user._id.toString();
    
    console.log(`Adding user ${req.user.username} to topic ${topicId}`);
    
    try {
        let topic = await Topic.findById(topicId);
        // let user = await User.findById(req.user._id);
        
        const idToString = id => id.toString();
        let listedUsers = topic.listedUsers.map(idToString);
        
        let add = true;
        if (listedUsers.includes(userId)) {
            // remove user if user is in list
            add = false;
            console.log('Removing user from list');
            topic.listedUsers = topic.listedUsers.map(idToString).filter(id => id !== userId);
        } else {
            // add user to list
            console.log('Adding user to list');
            topic.listedUsers.push(userId);
        }
        
        console.log(topic);
        
        topic.save(function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send({});
            }
            let message = add ? 'Added user to list' : 'Removed user from list';
            res.status(200).send({message});
        });
    } catch(err) {
        console.error(err);
    }
});

module.exports = router;

//Render the details topic page /topics/details/:topic_id
// router.all('/details', async function (req, res) {
//     if(typeof req.query.title === 'undefined' || typeof req.query.agency === 'undefined'){
//         return res.status(400).send({success:false, message:'Invalid Query Values!'});
//     }
//     try {
//         let data = await dynamo.getItemWithPromise({
//             TableName: 'SBIR_topics',
//             Key: {
//                 'title': req.query.title,
//                 'agency': req.query.agency
//             }
//         });
//         //Unwrap the Item from the promise call
//         let topic = data.Item;
//         let userKeys = topic.userKeys;
//         let userData = [];
//         if(userKeys) {
//             let emails = userKeys.map(key => ({'email': key}));
//             if (emails.length > 0) {
//                 let params = {
//                     RequestItems: {
//                         'SBIR_users': {
//                             Keys: emails
//                         }
//                     }
//                 };
//                 userData = await dynamo.batchGetItemPromise(params);
//                 console.log(userData.Responses.SBIR_users);
//                 userData = userData.Responses.SBIR_users;

//             }
//         }
//         res.render('topic_details', {
//             layout: 'details_layout',
//             title: topic.title,
//             agency: topic.agency,
//             branch: topic.branch,
//             program: topic.program,
//             topic_number: topic.topic_number,
//             official_link: topic.solicitation_link,
//             point_of_contact:topic.point_of_contact,
//             release_date: topic.release_date,
//             open_date: topic.open_date,
//             close_date: topic.close_date,
//             description: topic.desc,
//             users: userData,
//             keytitle: req.query.title,
//             keyagency: req.query.agency
//         });
//     }catch(err){
//         console.log(err);
//         console.log('Details page attempted access with title: ' + req.query.title + ' Agency: ' + req.query.agency);
//         return res.status(400).send({success:false, message:'Topic not found!'});
//     }
// });

// let intervalSet = false;
// let paginationKeys = [];

/**
 * Listens for message passed from master (line 31) and 
 * updates local paginationKeys variable 
 */
// process.on('message', (m) => {
//     paginationKeys = m;
// });

/**
 * Sets the global paginationKeys variable to a set of keys that represent query keys for the pagination of the database.
 * This method runs ONLY on the master node and syncs to the children objects via messaging the array of keys.
 */
// function generateKeys() {
//     paginationKeys.length = 0; //Empty array
    
//     const params = {
//         TableName: 'SBIR_topics', 
//         Limit:10
//     };
    
//     dynamo.getScanKeys(params, function(keys){
//         // console.log(keys);
//         paginationKeys = paginationKeys.concat(keys);
//         // console.log('After:', paginationKeys);
//         console.log('keys refreshed');
//         let app = require('../../app');
//         app.children.forEach(function (c){
//             console.log('Syncing keys for child: ' + c.id);
//             c.send(paginationKeys);
//         });
//     });
// }

/**
 * Creates the timed task on the MASTER cluster to refresh key values from the database every hour.
 * Runs ONCE. 
 */
// const setupKeyInterval = function() {
//     if(intervalSet === false) {
//         generateKeys();
//         setInterval(generateKeys, 3600000); //Refresh the keys every hour!
//         intervalSet = true;
//     }
// };

//Route to list user on a topic
// router.post('/details/list', async function(req, res){
//     console.log('post at details list');
//     console.log(req.body);

//     let topic;
//     try {
//         let decodedData = jwt.verify(req.body.token, config.secret);
//         topic = await dynamo.getItemWithPromise({
//             TableName: 'SBIR_topics',
//             Key: {
//                 'title': req.body.keytitle,
//                 'agency': req.body.keyagency
//             }
//         });
//         let unlisted = false;
//         if(topic.Item.userKeys ){
//             let index =  topic.Item.userKeys.indexOf(decodedData.email);
//             if(index !== -1){
//                 topic.Item.userKeys.splice(index, 1);
//                 unlisted = true;
//             }else {
//                 topic.Item.userKeys.push(decodedData.email);
//             }
//         }else{
//             topic.Item.userKeys = [decodedData.email];
//         }
//         //TODO: Change this post to update via update expression in DynamoDB
//         // const params = {
//         //     TableName: 'SBIR_topics',
//         //     Key:{
//         //         'title': topic.Item.title,
//         //         'agency': topic.Item.agency
//         //     },
//         //     Item: {
//         //         'title':topic.Item.title,
//         //         'agency': topic.Item.agency,
//         //         'branch': topic.Item.branch,
//         //         'close_date': topic.Item.close_date,
//         //         'desc':topic.Item.desc,
//         //         'open_date':topic.Item.open_date,
//         //         'overview':topic.Item.overview,
//         //         'program':topic.Item.program,
//         //         'release_date':topic.Item.release_date,
//         //         'solicitation_link':topic.Item.solicitation_link,
//         //         'topic_number':topic.Item.topic_number,
//         //         'point_of_contact':topic.Item.point_of_contact,
//         //         'userKeys':topic.Item.userKeys
//         //     }
//         // };
//         //const response = await dynamo.putItemWithPromise(params);
//         return res.status(200).send({success:true, message:'Listed success', unlisted:unlisted});
//     }
//     catch(err){
//         console.log(err);
//         if(err.name === 'TokenExpiredError'){
//             return res.status(401).send({success:false, message:'Expired token!'});
//         }
//         console.log('User was unable to query topic from list function! Fatal database error!');
//         return res.status(400).send({success:false, message:'Unable to find topic!'});
//     }
// });

//Redirect them to /topics/1
// router.get('/topics/out', function(req, res) {
//     console.log(req.query);
//     if(req.query.agency || req.query.program){
//         let params = {
//             TableName: 'SBIR_topics',
//             FilterExpression:'agency = :a',
//             ExpressionAttributeValues: {
//                 ':a': req.query.agency
//             }
//         };
//         if(req.query.program){
//             params.FilterExpression = 'program = :p';
//             params.ExpressionAttributeValues = {
//                 ':p': req.query.program
//             };
//         }
//         dynamo.scanAll(params , function(items){
//             if(items) {
//                 res.render('topics_list.handlebars', {
//                     layout: 'topics_layout',
//                     topic: items
//                 });
//             }else{
//                 res.render('topics_list.handlebars', {
//                     layout: 'topics_layout',
//                     topic: []
//                 });
//             }
//         });
//     }else {
//         res.redirect('/topics?page=1');
//     }
// });
// module.exports.setupKeyInterval = setupKeyInterval;