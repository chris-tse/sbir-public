let app = require('../app');
let AWS = require('aws-sdk');
const config = require('../config');
/**
 * Contains all of the methods for putting, getting, creating, and searching the database.
 */


/**
 * Scans the table one time with the given parameters.
 * Returns any error message and the data object associated with the scan if err === null.
 * Reference to the items in the table can be obtained via data.Items
 * @param config AWS Config options
 * @param params Search parameters
 * @param callback Returns the error and data objects.
 */

function scanTable(params, callback){
    // let AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
    dynamodb.scan(params, function (err, data){
        callback(err, data);
    });
}
/**
 * Returns every element in the database.
 * This method ignores any limit call and should thus NOT be provided. Providing a limit will only cause this function to scan the database needlessly.
 * @param config AWS config
 * @param params Scan params
 * @param callback Returns the data to a given callback function.
 * @returns {Promise<void>}
 */
//TODO: Try-catch the awaits and configure this to return an error
async function scanAll(params, callback){
    async function getAllTopics(params, items){
        const data = await scanWithPromise(params);
        items = items.concat(data.Items);
        if(typeof data.LastEvaluatedKey === 'undefined'){
            return items;
        }
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        return await getAllTopics(params,items);
    };
    const items = await getAllTopics(params, []);
    callback(items);
}
//TODO: Configure this to return an error in the catch, and an undefined error in the try. Change all usages of this method.
async function getScanKeys(params, callback){
    try {
        let scanKeys = async function scanKeys(params, keys) {
            const data = await scanWithPromise(params);
            if (typeof data.LastEvaluatedKey === 'undefined') {
                return keys;
            }
            keys.push(data.LastEvaluatedKey);
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            return await scanKeys(params, keys);
        };
        const keys = await scanKeys(params, []);
        callback(keys);
    }catch(err){
        console.log(err);
    }
}
/**
 * Returns a promise of the scan operation
 * @param params Scan Params
 */
function scanWithPromise(params){
    const dynamoDB = new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
    return dynamoDB.scan(params).promise();
}

function updateWithPromise(params){
    const dynamoDB = new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
    return dynamoDB.update(params).promise();
}

/**
 * Gets a singular item from the database via its Title and Agency data.
 * @param params Search parameters
 * @param callback Returns any errors and the object from the query.
 * @deprecated Use promise version
 */
function getItem(params, callback){
    const dynamodb = new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
    dynamodb.get(params, function (err, data){
        callback(err, data);
    });
}

function getItemWithPromise(params){
    const dynamoDB = new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
    return dynamoDB.get(params).promise();
}

function queryWithPromise(params){
    const dynamoDB = new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
    return dynamoDB.query(params).promise();
}

function batchGetItemPromise(params) {
    const dynamoDB = new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
    return dynamoDB.batchGet(params).promise();
}

/**
 * Puts a topic in the database
 * @param params AWS Database params
 * @param callback Returns any error and the object if error === null.
 * @deprecated Use promise version
 */
function putItem(params, callback){
    let config = require('../config');
    const dynamoDB = new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
    dynamoDB.put(params, function (err, data){
        callback(err, data);
    });
}

function putItemWithPromise(params){
    let config = require('../config');
    const dynamoDB = new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
    return dynamoDB.put(params).promise();
}

/**
 * Checks if the topic table exists. If no table is found, it attempts to create a new table using the production parameters.
 * @param config AWS Config
 */
function createTopicTable() {
    let dynamodb = new AWS.DynamoDB(config.AWS_CONFIG);

    dynamodb.describeTable({
        TableName: 'SBIR_topics'
    }, function (err, data) {
        if (err) {
            console.error('Unable to get table information. Attempting to create a new table.', JSON.stringify(err, null, 2));
            let params = {
                TableName: 'SBIR_topics',
                KeySchema: [
                    {AttributeName: 'title', KeyType: 'HASH'},  //Partition key
                    {AttributeName: 'agency', KeyType: 'RANGE'}  //Sort key
                ],
                AttributeDefinitions: [
                    {AttributeName: 'title', AttributeType: 'S'},
                    {AttributeName: 'agency', AttributeType: 'S'}
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 10,
                    WriteCapacityUnits: 10
                }
            };
            dynamodb.createTable(params, function (err, data) {
                if (err) {
                    console.error('Unable to create Topic table. Error JSON:', JSON.stringify(err, null, 2));
                } else {
                    console.log('Created Topic table.');
                }
            });
        }
    });
}

function getDocClient(){
    return new AWS.DynamoDB.DocumentClient(config.AWS_CONFIG);
}
/**
 * Checks if the topic table exists. If no table is found, it attempts to create a new table using the production parameters.
 * @param config AWS Config
 */
function createUserTable() {
    let dynamodb = new AWS.DynamoDB(config.AWS_CONFIG);

    dynamodb.describeTable({
        TableName: 'SBIR_users'
    }, function(err, data){
        if(err){
            console.error('Unable to get table information. Attempting to create a new User table.', JSON.stringify(err, null, 2));
            let params = {
                TableName: 'SBIR_users',
                KeySchema: [
                    {AttributeName: 'email', KeyType: 'HASH'}//Partition
                ],
                AttributeDefinitions: [
                    {AttributeName: 'email', AttributeType: 'S'}
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 10,
                    WriteCapacityUnits: 10
                }
            };
            dynamodb.createTable(params, function (err, data) {
                if (err) {
                    console.error('Unable to create User table. Error JSON:', JSON.stringify(err, null, 2));
                } else {
                    console.log('Created User table. Table description JSON:', JSON.stringify(data, null, 2));
                }
            });
        }
    });
}
module.exports = {
    getDocClient,
    batchGetItemPromise,
    getScanKeys,
    putItem,
    putItemWithPromise,
    createTopicTable,
    scanTable,
    scanAll,
    updateWithPromise,
    getItem,
    createUserTable,
    getItemWithPromise,
    queryWithPromise
};