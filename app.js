
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , path = require('path')
  , fs = require('fs')
  , passport = require('passport')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

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

var port = process.env.PORT || getenv('NODE_PORT');
console.log('port: '+port)

var store;
app.configure(function(){
  app.set('port', port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  store  = new express.session.MemoryStore;
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'randomstringthing123456', 
                            maxAge : Date.now() + 7200000, // 2h Session lifetime
                            store: store }))
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var test_data = "";
function setupData(req,res,next){
    // do something here
    test_data = "good data";
    next();
}
// Routes

app.get('/', routes.index);
app.get('/login', function(req, res) {
  req.session.message = 'Hello World';
  req.session.username = 'lkim';
  // do some oauth stuff here

  res.render('login', {"title":"Login", 'username':'testUser', 'slcclientid':process.env.slcclientid});
});

app.get('/logout', function(req, res) {
  req.session.maxAge = -1;
  req.session.destroy(function(err){
   console.log('session destroyed');
   res.redirect('/');
  });
})

function loadUser(req, res, next) {
  if (req.session.message) {
        console.log('got '+req.session.message+' out of the session, age is '+req.session.maxAge);
        req.currentUser = "someUser";
        next();
  } else {
    res.redirect('/sessions/new');
  }
}

app.get('/students', loadUser, function(req, res) {
  res.render('students', {'title':'Students', username: req.session.username});
});

// res.render('view_name.jade', { clients_label: client })

app.listen(app.get('port'));
console.log("Express server listening on port %d", app.get('port'));


