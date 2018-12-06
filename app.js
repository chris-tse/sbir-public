// NPM imports
const cluster = require('cluster');
const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const paginate = require('handlebars-paginate');
const dateFormat = require('handlebars-dateformat');
const helmet = require('helmet');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser')
const AWS = require('aws-sdk');
const favicon = require('serve-favicon');
const session = require('express-session');
const DynamoDBStore = require('connect-dynamodb')({session: session});
const validator = require('express-validator');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('connect-flash');
const normalizeUrl = require('normalize-url');
// const csrf = require('csurf');

// Model imports
const User = require('./models/user');

// Route imports
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const profile = require('./routes/profile');
const topics = require('./routes/topics/topics');
const topicsSearch = require('./routes/topics/search');
const passwordreset = require('./routes/passwordreset');
const admin = require('./routes/admin');
const config = require('./config');


// App initialization
const app = express();
const dynamoDb = new AWS.DynamoDB();
const dynamo = require('./dynamodb/DynamoDBHandler.js');
// const csrfProtection = csrf();

// Code to run if we're in the master process idk what this does don't ask
if (cluster.isMaster) {
    
    // Create a worker for each CPU
    const cpuCount = process.env.NODE_ENV === 'production' ? require('os').cpus().length : 2;
    for (let i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }
    // Listen for terminating workers
    cluster.on('exit', function (worker) {
        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();
    });
    
    module.exports = app;
// Code to run if we're in a worker process
} else {
    console.log('NODE_ENV is set to:', process.env.NODE_ENV);
    
    const mongoURI = process.env['MONGO_URI'];
    console.log(mongoURI);
    
    mongoose.connect(mongoURI);
    
    mongoose.connection.on('connected', () => console.log('DB connection success'));
    
    //View engine setup
    app.set('view engine', 'hbs');
    app.engine('hbs', exphbs({
        extname: 'hbs',
        defaultLayout: 'default',
        helpers: {
            paginate,
            dateFormat,
            section: function(name, options){
                if(!this._sections) this._sections = {};
                this._sections[name] = options.fn(this);
                return null;
            },
            bothNotNull: (val1, val2, options) => (val1 !== 'NULL' || val2 !== 'NULL') ? options.fn(this) : options.inverse(this),
            firstName: (val) => {
                let name = val.split(' ')[0];
                return name.charAt(0).toUpperCase() + name.substr(1);
            },
            normalize: (url) => {
                let normalized = normalizeUrl(url);
                console.log(normalized.substring(0, 7));
                if (normalized.substring(0, 7).indexOf('s') > -1) {
                    console.log('yes');
                    return normalized.substr(8);
                } else {
                    console.log('no');
                    return normalized.substr(7);
                }
            }
        }
    }));
    app.set('views', __dirname + '/views');
    // app.set('trust proxy', 1); // trust first proxy
    
    // Set public directory path
    app.use(express.static(path.join(__dirname, '/public')));
    
    // Set middleware
    app.use(bodyParser.json({limit: '5mb'}));
    app.use(bodyParser.urlencoded({limit: '5mb', extended: false, parameterLimit:300}));
    // app.use(cookieParser());
    app.use(helmet());
    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    app.use(session({
        store: new DynamoDBStore({
            table: 'session-store',
            AWSConfigJSON: config.AWS_CONFIG
        }),
        secret: config.secret,
        proxy: process.env.NODE_ENV === 'production' ? true : false,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === 'production' ? true : false,
            maxAge: 30*24*60*60*1000
        },
        name: 'sbirsession',
    }));
    // app.use(csrf());
    app.use(flash());
    
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    
    app.use(validator());
    
    // Give Views/Layouts direct access to session data.
    app.use(function(req, res, next){
        res.locals.user = req.user;
        res.locals.isAuthenticated = req.isAuthenticated();
        res.locals.agencies = require('./constants').agencies;
        next();
    });
    
    app.use('/', (req, res, next) => {
        // console.log(req.session);
        // console.log(req.user);
        next();
    });
    // Index and auth routes open to public
    app.all('/', indexRoutes);
    app.all('/contact', indexRoutes);
    app.get('/passchangeredirect', indexRoutes);
    app.use('/', authRoutes);
    app.all('/topics', topics);
    app.all('/forgotpassword', passwordreset);
    // app.all('/register', register);
    // app.all('/logout', logout);
    // app.all('/login', login);
    // Routes that need user to be logged in
    app.use((req, res, next) => {
        // console.log('hit middleware');
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/login');
    });
    
    app.all('/profile', profile);
    app.all('/profile/*', profile);
    app.all('/topics/*', topics, topicsSearch);
    app.all('/details', topics);
    app.all('/details/list', topics);
    
    app.use((req, res, next) => {
        console.log(req.user);
        if (req.user.admin) {
            return next();
        }
        
        return res.render('denied');
    });
    app.all('/admin/*',admin);
    
    // app.post('/api/authenticate', require('./routes/api/authenticate'));
    // app.all('/profile/*', login);
    // app.all('/verifytoken', login);
    /*Middleware to protect all routes below with authentication*/
    
    
    
    /*Authenticated Routes*/
    // app.all('/api/topic', topic_api);
    // app.get('/api/topic/all', topic_api);
    
    const port = process.env.PORT || 3000;
    app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
    module.exports = app;
}