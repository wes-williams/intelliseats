
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , config = require('./config')
  , SLC = require('./client/SLC');

var app = express();

/**
 * Configuration 
 */

var store;
app.configure(function(){
  app.set('port', config.app.port);
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

//OAuth config
slc = new SLC(config.api.base_url, 
              config.api.client_id, 
              config.api.client_secret, 
              config.api.oauth_uri);

/**
 * Routes 
 */

app.get('/', routes.index);

app.get('/logout', function(req, res) {
  req.session.maxAge = -1;
  req.session.valid = false;
  req.session.destroy(function(err){
    res.redirect('/');
  });
});

app.get('/login', function(req, res, body) {
  var loginURL = slc.getLoginURL();
  res.redirect(loginURL);
});

app.get('/auth/provider/callback', function (req, res) {
  var code = req.param('code', null);
  //console.log('received callback with code ',code);
  slc.oauth({code: code}, function (token) {
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
     req.currentUser = "someUser";
     next();
  } else {
    res.redirect('/login');
  }
}

app.get('/students', loadUser, function(req, res) {
  if (req.session.token) {
    slc.api("/sections", "GET", req.session.token, {}, {}, function (returnedSections) {
      var selectedSection; // still smoke and mirrors
      var sectionsLen = returnedSections.length;
      for (var i=0; i<sectionsLen; i++) {
        selectedSection = returnedSections[i].id;
        // prefer this section since it has the most students
        if (selectedSection === '80eda552509f705dfb333fc205ff70195735fbf0_id') {
	  break;
        }
      }

      var currentUser = req.session.username || 'Guest';
      var students;
      slc.api("/sections/" + selectedSection + "/studentSectionAssociations/students", "GET", req.session.token, {}, {}, function (returnedStudents) {
        students = returnedStudents; 

        req.session.valid = 'true';
        res.render('students', {'title':'Seating Chart', 'students': students, 'validSession': req.session.valid, displayName: currentUser});
      });
      
    });
  }
});

app.listen(app.get('port'));
console.log("listening on port %d", app.get('port'));
