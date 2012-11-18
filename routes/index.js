
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};

exports.login = function(req, res, data){
	res.render('login', { title: 'Login', data: data});
  console.log('rendered login view');
}