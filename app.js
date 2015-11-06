var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var bodyParser = require('body-parser');

var routes = require('./routes');
var hbs = require('hbs');
var hbsHelpers = require('./helpers/hbs');
var sso = require('./sso')
// var amuiHelper = require('amui-hbs-helper')(hbs);

var app = express();
hbs.registerPartials(__dirname + '/views/partials');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('hbs', hbs.__express);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'dd-meeting',
    key: 'meeting', // cookie name
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}, // 30 days
    store: new MongoStore({
        db: 'meeting',
        host: 'localhost',
        port: '27017'
    }),
    resave: true,
    saveUninitialized: true
}));

app.use(flash());
if (process.env.NODE_DEV) {
    app.use(require('less-middleware')(path.join(__dirname, 'public')));
}

app.use(express.static(path.join(__dirname, 'public')));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
app.set('trust proxy', 1);
sso(app);
routes(app)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
