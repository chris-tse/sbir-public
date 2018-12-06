const express = require('express');
const router = express.Router();
const dynamo = require('../../dynamodb/DynamoDBHandler');
const { sanitizeBody } = require('express-validator/filter');

router.get('/topics/search', async function(req, res) {
    
    let page = parseInt(req.query.page);
    
    if (Number.isNaN(page) || page < 1)
        page = 1;
    
    if (req.query.keywords) {
        
        const currKeywords = req.query.keywords.toLowerCase();
        const searchQuery = currKeywords.replace(/\s+/g, '+').toLowerCase();
        
        let FE = [];
        let EAV = {};
        let count = 1;
        searchQuery.split('+').forEach(term => {
            let currTerm = `:term${count}`;
            let currTermCap = `:term${count}Cap`;
            let currTermAllCap = `:term${count}AllCap`;
            EAV[currTerm] = term;
            EAV[currTermCap] = term.charAt(0).toUpperCase() + term.slice(1);
            EAV[currTermAllCap] = term.toUpperCase();            
            count++;
        });
        // contains(#desc, :keyword) or contains(#title, :keyword)
        Object.keys(EAV).forEach(key => {
            FE.push(`contains(#desc, ${key})`);
            FE.push(`contains(#title, ${key})`);
        });
        
        console.log('EAV:', EAV);
        
        const params = {
            TableName: 'SBIR_topics', 
            Limit: 10,
            ExpressionAttributeNames: {
                '#desc': 'desc',
                '#title': 'title'
            },
            FilterExpression: FE.join(' or ')
        };
        params.ExpressionAttributeValues = EAV;
        
        console.log('PARAMS:', params);
        
        let renderPage = () => {
            dynamo.scanTable(params, function(err, data){
                let pageCount = req.session.searchKeys.length;
                res.render('topics_search_list', {
                    title: 'Topics - SBIR_Connector',
                    topics: data.Items,
                    searchQuery,
                    search: searchQuery.split('+').join(' '),
                    pagination: {
                        str: searchQuery,
                        page,
                        pageCount
                    }

                });
            });
        };
        
        if (!req.session.keywords || req.session.keywords !== currKeywords) {
            req.session.keywords = currKeywords;
            console.log('🍪🍪🍪 FIRST ONE');
            dynamo.getScanKeys(params, keys => {
                console.log('KEYS:', keys);
                console.log('KEYS RETRIEVED:', keys.length);
                req.session.searchKeys = [...keys];
                // console.log(req.session);
                // console.log(req.session.searchKeys);
                params.ExclusiveStartKey = page > 1 ? req.session.searchKeys[(page - 1)] : null;
                renderPage();
                
                
            });
        } else {
            
            console.log('🚀🚀🚀 SECOND ONE');
            
            // console.log(req.session);
            params.ExclusiveStartKey = page > 1 ? req.session.searchKeys[(page - 1)] : null;
            renderPage();
            
            // dynamo.scanTable(params, function(err, data){
            //     let pageCount = req.session.searchKeys.length;
            //     if (data.Count < 10 && page === 1)
            //         pageCount = 1; 
            //     res.render('topics_search_list',{
            //         title: 'Topics - SBIR_Connector',
            //         topics: data.Items,
            //         pagination: {
            //             str: searchQuery,
            //             page,
            //             pageCount
            //         }

            //     });
            // });
        }
    } else 
        res.redirect('/topics');
    
    //     const keywords = req.query.keywords;
    // let page = parseInt(req.query.page);
    
    // // set page to 1 if invalid page number
    // page = Number.isNaN(page) || page < 0 ? 1 : page;
    // console.log(`{${keywords}, ${page}}`);
    
    // // redirect to main topics list if keyword is undefined or empty search params
    // if (keywords === undefined || keywords.length < 1)
    //     return res.redirect('/topics');
        
    // const params = {
    //     TableName: 'SBIR_topics',
    //     ExpressionAttributeValues: {
    //         ':keyword': keywords,
    //         ':keywordCap': keyword.charAt(0).toUpperCase() + keyword.slice(1)
    //     },
    //     ExpressionAttributeNames: {
    //         '#desc': 'desc',
    //         '#title': 'title'
    //     },
    //     FilterExpression: 'contains(#desc, :keyword) or contains(#title, :keyword) or contains(#desc, :keywordCap) or contains(#title, :keywordCap)'
    // };
    
    // dynamo.scanAll(params, function(data) {
    //     res.render('topic_search_list',{
    //         title: 'Topics - SBIR_Connector',
    //         keyword,
    //         noResults: data.length < 1 ? true : false,
    //         topic: data,
    //         pagination: {
    //             str: 'fat',
    //             page,
    //             pageCount
    //         }
    //     });
    // });
    
    
});

router.post('/topics/search',
    sanitizeBody('keywords'),
    function(req, res) {
        const keywords = req.body.keywords;
        console.log(keywords);
        req.session.search = keywords;
        
        const searchQuery = keywords.replace(/\s+/g, '+').toLowerCase();
        console.log(searchQuery);
        res.redirect(`/topics/search?keywords=${searchQuery}&page=1`);
    }
);

module.exports = router;