const express = require('express');
const router = express.Router();
const fs = require('fs');
const parse = require('csv-parse');
const formidable = require('formidable');
const MODEL_PATH = '../models/'; //Work around for webstorm not detecting mongo documentation. DUMBEST SHIT IN THE WORLD
const Topic = require(MODEL_PATH + 'topic');

router.get('/admin/database', function (req, res) {

    res.render('database', {
        title: 'Database - SBIR_Connector',
        errors: req.session.errors,
        badinput: req.session.badinput,
        responseReturned:false
    });

    req.session.errors = null;
    req.session.badinput = null;
});

router.post('/admin/database', async function(req, res){
    console.log('Got file');
    let form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        console.log(JSON.stringify(files));
        // res.writeHead(200, {'content-type': 'text/plain'});
        // res.write('received upload:\n\n');
        // res.end(util.inspect({fields: fields, files: files}));
        let rs = fs.createReadStream(files[Object.keys(files)[0]].path); //Access the first file that is uploaded.
        rs.on('error', function (error) {
            console.log('Caught', error);
            res.render('database', {
                title: 'Database - SBIR_Connector',
                errors: req.session.errors,
                badinput: req.session.badinput,
                responseReturned: true,
                successNum: 0,
                failNum: 0,
                logs: '<b>Select file again.</b>'
            });
        });
        let parser = parse({columns: true}, async function (err, data) {
            console.log(data);
            let success = 0;
            let fail = 0;
            let log = '';
            for (const element of data) {
                element.overview = '';
                element.listedUsers = [];
                try {
                    let result = await Topic.update({title: element.title}, element, {upsert: true});
                    console.log(result);
                    success++;
                } catch (error) {
                    fail++;
                    log += JSON.stringify(error) + '\n';
                }
            }
            res.render('database', {
                title: 'Database - SBIR_Connector',
                errors: req.session.errors,
                badinput: req.session.badinput,
                responseReturned: true,
                successNum: success,
                failNum: fail,
                logs: log
            });
        });
        rs.pipe(parser);
    });
});


module.exports = router;