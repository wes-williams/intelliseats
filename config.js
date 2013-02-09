var config = {};

config.app = {};

config.app.port = 3000;
config.api = {};

config.api.base_url = 'https://api.sandbox.inbloom.org';
config.api.client_id = '**CLIENT_ID_GOES_HERE**';
config.api.client_secret = '**CLIENT_SECRET_GOES_HERE**';
config.api.oauth_uri = 'http://127.0.0.1:3000/auth/provider/callback';
config.api.api_version = "v1";

module.exports = config;
