var express  = require('express');
var app      = express();                 // create our app w/ express
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var yaml = require('js-yaml');
var fs = require('fs');
var port = 9844;

var Sequelize = require('sequelize');

var config_dir = __dirname + "/config";
var db_config = yaml.load(fs.readFileSync(config_dir + "/db_config.yml", 'utf8'));
var sequelize = new Sequelize(db_config.db);

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

// routes
app.get('/retailers', function (req, res) {
  sequelize.query("SELECT COUNT(*) as num_retailers FROM retailers WHERE state = 'engaged'", { type: sequelize.QueryTypes.SELECT})
  .then(function(result) {
    // We don't need spread here, since only the results will be returned for select queries
    res.json(result[0])
  })
})

app.get('/brands', function (req, res) {
  res.send("A million")
})

app.get('/engaged_locations', function (req, res) {
  res.send("A Killamenjaro-ian")
})

app.get('*', function (req, res) {
  res.sendFile('./public/index.html')
})


app.listen(port);
console.log("App listening on port ", port);
