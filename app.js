var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session    = require('express-session');

var MongoStore = require('connect-mongo')(session);
var settings = require('./settings');


var routes = require('./routes/index');
var manage = require('./routes/manage');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
var env = process.env.NODE_ENV || 'development';
if (env === 'development') {    
  app.use(logger('dev'));
}else{
  app.use(logger('combined'))
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
    secret: settings.cookieSecrect,
    resave: false,
    saveUninitialized: false,
	store: new MongoStore({
		url: settings.dbAddr
	})
}));

app.use('/', function(req, res, next){
	next();
});

app.use(settings.rootPath, express.static(path.join(__dirname, 'public')));
//app.use('/', routes);
app.use(settings.rootPath + '/app', routes);
app.use(settings.rootPath + '/manage', manage);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (env === 'development') {
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
