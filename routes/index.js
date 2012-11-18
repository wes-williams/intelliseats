
/*
 * GET home page.
 */

exports.index = function(req, res){
  var intro = "Throw away your paper gradebooks and seating charts! " 
              + " Intelliseats is an application that allows teachers to create visual seating charts,"
              + " flag students for intervention, track those interventions,"
              + " track assessments and assignments and adjust your lesson planning on the fly."
              + " Keep your time and focus where it is need the most; on your students!";
  res.render('index', { title: 'Home', 'intro': intro });
  console.log('rendering the home page');
};

exports.login = function(req, res, data){
	res.render('login', { title: 'Login', data: data});
  console.log('rendered login view');
}