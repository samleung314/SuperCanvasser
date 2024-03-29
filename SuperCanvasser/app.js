var createError = require('http-errors');

// include mongodb
var mongodb = require('./mongodb');

// create express app
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

//https creation
var fs = require('fs');
var http = require('http');
var https = require('https');

var winston = require('./winston');
var morgan = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var databaseRouter = require('./routes/database');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(morgan('combined', { stream: winston.stream }));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/database', databaseRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//start http and https server
//http://35.237.133.218:8080
//https://35.237.133.218:8443
var httpServer = http.createServer(app);
var httpsServer = https.createServer({
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem')
}, app);
httpServer.listen(8080);
httpsServer.listen(8443);

// start server
//app.listen(80, () => console.log('SuperCanvasser listening on port 80!'))
module.exports = app;

/*
npm install node-gyp -g
npm install bcrypt -g

npm install bcrypt -save
*/