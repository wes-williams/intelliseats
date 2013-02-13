
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , config = require('./config')
  , intel = require('./intel')
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
  slc.oauth({code: code}, function (token) {
    if (token !== null || token !== undefined) {
      req.session.token = token;
      res.redirect('/students');
    }
    else {
      res.redirect('html/error.html');
    }
  });
});

function loadUser(req, res, next) {
  if (req.session.token) {
     if(!req.session.username) {
       slc.api("/system/session/check","GET",req.session.token,{},{}, function(data) { 
         req.session.username = data.full_name;
         next();
       });
     } else {
       next();
     }
  } else {
    res.redirect('/login');
  }
}

function studentsHandler(req,res) {

  if (req.session.token) {
    slc.api("/sections", "GET", req.session.token, {}, {}, function (returnedSections) {

      returnedSections.sort(function(a,b) {
        var aVal = a.uniqueSectionCode.toLowerCase();
        var bVal = b.uniqueSectionCode.toLowerCase();
        return aVal<bVal?-1:(aVal>bVal?1:0);  
      });
      //for(var i=0;i<returnedSections.length;i++) console.log('after :' + returnedSections[i].uniqueSectionCode);

      var selectedSection = req.param('sectionId',returnedSections[0].id);

      var sections = returnedSections;
      var currentUser = req.session.username;
      var students;
      slc.api("/sections/" + selectedSection + "/studentSectionAssociations/students", "GET", req.session.token, {}, {}, function (returnedStudents) {
        students = returnedStudents; 

        // build an index 
	var studentIds = [];
	for(var i=0;i<students.length;i++) {
          studentIds.push(students[i].id);
          students[i].riskFactor = 0; 
	}

        slc.api("/sections/" + selectedSection + "/studentSectionAssociations/students/studentGradebookEntries",
	        "GET", req.session.token, {}, {}, function (returnedGrades) {

          // sort by date desc
          returnedGrades.sort(function(a,b) {
            var aVal = a.dateFulfilled;
            var bVal = b.dateFulfilled;
            return -1 * (aVal<bVal?-1:(aVal>bVal?1:0));  
          });
          //for(var i=0;i<returnedGrades.length;i++) console.log(returnedGrades[i]);

	  // 30 day ago
          var monthAgo = new Date(new Date().getDate()-30);

	  for(var i=0;i<returnedGrades.length;i++) {
	    // only collecting the last month of grades
	    //if(monthAgo > returnedGrades.dateFulfilled) {
            //  break;
	    //}

            var studentIndex = studentIds.indexOf(returnedGrades[i].studentId);
	    if(studentIndex==-1) {
              continue;
	    }
            students[studentIndex].riskFactor += intel.findRiskFactor(returnedGrades[i]);
	  }

          res.render('students', {'title':'Seating Chart', 
	                          'sections': sections, 
                                  'selectedSection' : selectedSection,
                                  'students': students, 
                                  'validSession' : 'true',
                                  'displayName': currentUser});
        });
      });
      
    });
  }
}

app.get('/students', loadUser, studentsHandler);
app.post('/students', loadUser, studentsHandler); 

app.get('/test', function(req,res) {
  slc.api(req.param('url','/students'), "GET", req.session.token, {}, {}, function (data) {
    res.send(data);
  });
});

app.listen(app.get('port'));
console.log("listening on port %d", app.get('port'));
