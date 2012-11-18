
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , path = require('path')
  , fs = require('fs');

var app = express();

// Configuration

// If you need to pull from env variables
function getenv(name) {
  var val = process.env[name.toUpperCase()];
  if (!val) {
    console.error('missing environment variable ' + JSON.stringify(name) + ': ', val);
  }
  console.log('found env '+name+' with value '+val);
  return val;
}

var port = getenv('NODE_PORT');
console.log('port: '+port)

app.configure(function(){
  app.set('port', process.env.NODE_PORT || port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// Routes

app.get('/', routes.index);

app.listen(app.get('port'));
console.log("Express server listening on port %d", process.env.NODE_PORT);


