
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , path = require('path')
  , fs = require('fs')
  , passport = require('passport')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , config = require('./config')
  , slcprofile = require('./slcprofile')
  , SLC = require('./client/SLC');

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

var authUrl = config.api.base_url + '/api/oauth/authorize';
var tokenUrl = config.api.base_url + '/api/oauth/token';
var clientId = process.env.slcclientid || config.api.client_id;
var clientSecret = process.env.slcclientsecret || config.api.client_secret;
var callbackUrl = process.env.callbackUrl || config.api.oauth_uri;

console.log('authUrl: ',authUrl,' tokenUrl: ',tokenUrl,' clientId: ',clientId,' callbackUrl: ',callbackUrl);

//OAuth config
SLC_app = new SLC(config.api.base_url, 
                  clientId, 
                  clientSecret, 
                  callbackUrl);
/*
passport.use('provider', new OAuth2Strategy({
    authorizationURL: authUrl,
    tokenURL: tokenUrl,
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: callbackUrl
  },
  function(accessToken, refreshToken, profile, done) {
    console.log('did oauth succeed? '+accessToken+' refresh '+refreshToken+' profile '+profile);
    slcprofile.setName(accessToken);
    //done(err, user);
  }
));*/


// Routes

app.get('/', routes.index);
app.get('/oldlogin', function(req, res) {
  req.session.message = 'Hello World';
  req.session.username = 'lroslin'; // Nathan Butler?
  slcprofile.setName('login name');
  // do some oauth stuff here

  res.render('login', {"title":"Login", 'username':'testUser', 'slcclientid':process.env.slcclientid});
});

app.get('/logout', function(req, res) {
  req.session.maxAge = -1;
  req.session.destroy(function(err){
   console.log('session destroyed');
   res.redirect('/');
  });
});


app.get('/login', function(req, res, body) {
  var loginURL = SLC_app.getLoginURL();
  res.redirect(loginURL);
});

app.get('/auth/provider/callback', function (req, res) {
  var code = req.param('code', null);
  console.log('received callback with code ',code);
  SLC_app.oauth({code: code}, function (token) {
      if (token !== null || token !== undefined) {
        req.session.tokenId = token;
        console.log('received token ',token);
        slcprofile.setName('logged in!');
        req.session.message = "logged in";
        req.session.token = token;
        res.redirect('/students');
      }
      else {
        res.redirect('html/error.html');
      }
  });

});

/*
app.get('/auth/provider', passport.authenticate('provider'));

app.get('/auth/provider/callback', function(req, res) {
  slcprofile.setName('blahblee');
  console.log('what the heck happens here');
});*/
  //passport.authenticate('provider', { successRedirect: '/students',
  //                                    failureRedirect: '/' }));



function loadUser(req, res, next) {
  if (req.session.message) {
        console.log('got '+req.session.message+' out of the session, age is '+req.session.maxAge);
        req.currentUser = "someUser";
        next();
  } else {
    res.redirect('/login');
  }
}

app.get('/students', loadUser, function(req, res) {
  if (req.session.token) {
    var students = getStudents(req.session.token)

  res.render('students', {'title':'Students', displayName: slcprofile.displayName});
  }
  

});

app.get('/jqtest', function(req, res) {
  res.render('jqtest', {"test" : "yes" });
});

// res.render('view_name.jade', { clients_label: client })

app.listen(app.get('port'));
console.log("Express server listening on port %d", app.get('port'));

var slcApiUri = 'https://api.sandbox.slcedu.org/';
/*
Accept: application/vnd.slc+json
Content-Type: application/vnd.slc+json
Authorization: bearer oauth_token*
GET $BASE_URL$/api/rest/v1/home*/
// callbacks and functions and all that jazz
function getStudents(token, callback) {

  var apiOpts = {
    'Accept': 'application/vnd.slc+json',
    'Content-Type': 'application/vnd.slc+json',
    'Authorization': 'bearer ' + token;
  };

  request.get(requestUrl, function(error, response, body) {
    if (response.statusCode !== 200) {
      return "API error";
    }
    return response.statusCode;
  });

  var students = locationEnrichment(location, function(err, geolocations) {
    getYelpPlaces(geolocations[0].city, geolocations[0].state.name, food, function(err, places) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, places);
    });  
  });
}


