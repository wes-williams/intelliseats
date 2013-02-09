
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
//  , path = require('path')
//  , fs = require('fs')
  , config = require('./config')
  , SLC = require('./client/SLC')
  , request = require('request');

var app = express();

// Configuration

var port = config.app.port;

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

//OAuth config
SLC_app = new SLC(config.api.base_url, 
                  clientId, 
                  clientSecret, 
                  callbackUrl);

// Routes

app.get('/', routes.index);

app.get('/logout', function(req, res) {
  req.session.maxAge = -1;
  req.session.valid = false;
  req.session.destroy(function(err){
  res.redirect('/');
});
});

app.get('/login', function(req, res, body) {
  var loginURL = SLC_app.getLoginURL();
  res.redirect(loginURL);
});

app.get('/auth/provider/callback', function (req, res) {
  var code = req.param('code', null);
  //console.log('received callback with code ',code);
  SLC_app.oauth({code: code}, function (token) {
      if (token !== null || token !== undefined) {
        req.session.tokenId = token;
        //console.log('received token ',token);

        req.session.message = "logged in";
        req.session.username = "Linda Kim";
        req.session.token = token;
        res.redirect('/students');
      }
      else {
        res.redirect('html/error.html');
      }
  });
});

function loadUser(req, res, next) {
  if (req.session.message) {
        //console.log('got '+req.session.message+' out of the session, age is '+req.session.maxAge);
        req.currentUser = "someUser";
        next();
  } else {
    res.redirect('/login');
  }
}

app.get('/students', loadUser, function(req, res) {
  if (req.session.token) {
    var sections = getSections(req.session.token, function(error, statusCode, rawSections) {
      console.log('status code from SLC api: ',statusCode);
      var returnedSections = JSON.parse(rawSections);
    
      var sectionsLen = returnedSections.length;
      var superClass = {};
      for (var i=0; i<sectionsLen; i++) {

        var linksLen = returnedSections[i].links.length;
        var testSection = returnedSections[i];

	console.log('VALDI SESSION = ' +testSection.id);

        if (testSection.id === '80eda552509f705dfb333fc205ff70195735fbf0_id') {
          superClass.uniqueSectionCode = testSection.uniqueSectionCode;
          superClass.id = testSection.id
          superClass.sessionId = testSection.sessionId;
          
          for (var j=0;j<linksLen;j++) {
            if (testSection.links[j].rel === "getStudents") {
              superClass.rel = testSection.links[j].rel;
              superClass.href = testSection.links[j].href;
            }
          }
        }
      }

      var currentUser = req.session.username || 'Linda Kim';

      var eigthGrade = superClass.href;
      var students;
      getStudents(req.session.token, eigthGrade, function(err, statusCode, returnedStudents) {
        students = returnedStudents; 

        req.session.valid = 'true';
        res.render('students', {'title':'Seating Chart', 'students': students, 'validSession': req.session.valid, displayName: currentUser});
      });
      
    });
  }
});

app.listen(app.get('port'));
console.log("Express server listening on port %d", app.get('port'));

// callbacks and functions and all that jazz
function getSections(token, callback) {
  var bearer = 'bearer ' + token;
  var apiHeaders = {
    'Accept': 'application/vnd.slc+json',
    'Content-Type': 'application/vnd.slc+json',
    'Authorization': bearer
  };

  var requestUrl = config.api.base_url + '/api/rest/v1/sections';

  var apiOpts = {
    headers: apiHeaders,
    uri: requestUrl
  }

  request.get(apiOpts, function(error, response, body) {
    if (error) {
        console.log('some other req error',error);
        callback(error);
        return;
    }

    if (response.statusCode && response.statusCode !== 200) {
      console.log('response.statusCode ',response.statusCode)
      callback("API error");
    }
    
    callback(null, response.statusCode, response.body);
  });
};

function getStudents(token, url, callback) {
  var bearer = 'bearer ' + token;
  var apiHeaders = {
    'Accept': 'application/vnd.slc+json',
    'Content-Type': 'application/vnd.slc+json',
    'Authorization': bearer
  };

  //var requestUrl = slcApiUri + 'api/rest/v1/students';
  //console.log('making a call to ',url);

  var apiOpts = {
    headers: apiHeaders,
    uri: url
  }
  console.log('getting students at ',url);

  request.get(apiOpts, function(error, response, body) {
    if (error) {
        console.log('some other req error',error);
        callback(error);
        return;
    }

    if (response.statusCode && response.statusCode !== 200) {
      console.log('response.statusCode ',response.statusCode)
      callback("API error");
    }
   
    var students = JSON.parse(response.body);

    callback(null, response.statusCode, students);
  });
};


