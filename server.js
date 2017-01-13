var express  = require('express');
var app      = express();                 // create our app w/ express
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var yaml = require('js-yaml');
var fs = require('fs');
var moment = require('moment');
var port = 9844;

var Sequelize = require('sequelize');

var config_dir = __dirname + "/config";
var db_config = yaml.load(fs.readFileSync(config_dir + "/db_config.yml", 'utf8'));
var sequelize = new Sequelize(db_config.db);

var celebrations = require('./lib/CelebrationService');
var arr = require('./lib/ARRService');


app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

// routes
app.get('/retailers', function (req, res) {
  sequelize.query("SELECT state, COUNT(*) as num_retailers " +
									"FROM pbxx.retailers " +
									"WHERE deleted_at IS NULL " +
									"GROUP BY state" , { type: sequelize.QueryTypes.SELECT})
  .then(function(result_count) {
    	res.json(result_count)
  	})
  })

app.get('/brands', function (req, res) {
  sequelize.query("SELECT brands.status, COUNT(*) as brand_count " +
										"FROM brands " +
										"WHERE brands.deleted_at IS NULL " +
										"AND slug NOT LIKE '%promoboxx%' " +
										"GROUP BY brands.status", { type: sequelize.QueryTypes.SELECT})
  	.then(function (results) {
  		res.json(results)
  	})
})

app.get('/brand_campaigns', function (req, res) {
	sequelize.query("SELECT EXTRACT(YEAR FROM start_date) as year, EXTRACT(MONTH FROM start_date) as month, COUNT(*) as campaigns_launched " +
									"FROM campaigns " +
									"WHERE deleted_at IS NULL " +
									"  AND campaign_type <> 'retailer_discovered' " +
									"  AND start_date IS NOT NULL " +
									"  AND DATE_FORMAT(start_date, '%Y-%M') <= DATE_FORMAT(CURDATE(), '%Y-%M') " +
									"GROUP BY EXTRACT(YEAR FROM start_date), EXTRACT(MONTH FROM start_date) " +
									"ORDER BY year DESC", { type: sequelize.QueryTypes.SELECT})
	.then(function (results) {
		res.json(results)
	})
})

app.get('/shares', function (req, res) {
	sequelize.query("SELECT * " +
									"FROM ( " +
									"SELECT DATE_FORMAT(executed_at, '%Y-%m') as date, 'facebook' as type, COUNT(*) as num_shares_made " +
									"FROM facebook_shares " +
									"GROUP BY DATE_FORMAT(executed_at, '%Y-%m') " +
									"UNION " +
									"SELECT DATE_FORMAT(executed_at, '%Y-%m') as date, 'twitter' as type, COUNT(*) as num_shares_made " +
									"FROM twitter_shares " +
									"GROUP BY DATE_FORMAT(executed_at, '%Y-%m') " +
									") AS E", { type: sequelize.QueryTypes.SELECT})
	.then(function (results) {
		res.json(results)
	}, function (err) {
		console.log(err)
	})
})

app.get('/cd_campaigns', function (req, res) {
	sequelize.query("SELECT DATE_FORMAT(start_date, '%Y-%m') AS date, COUNT(*) as campaigns_launched " +
									"FROM campaigns " +
									"WHERE deleted_at IS NULL " +
									"  AND campaign_type = 'retailer_discovered' " +
									"GROUP BY DATE_FORMAT(start_date, '%M-%Y') " +
									"ORDER BY DATE_FORMAT(start_date, '%Y-%m') DESC", { type: sequelize.QueryTypes.SELECT})
	.then(function (results) {
		res.json(results)
	})
})

app.get('/ad_runs', function (req, res) {

	sequelize.query("SELECT intended_self_fund_amount_cents > 0 as is_rf, COUNT(*) as count " +
									"FROM ad_runs " +
									"WHERE created_at > '2017-01-01' AND status = 'complete' AND deleted_at IS NULL " +
									"GROUP BY intended_self_fund_amount_cents > 0", { type: sequelize.QueryTypes.SELECT })
	.then(function (results) {
		res.json(results)
	})

})

app.get('/brand_requests', function (req, res) {

	sequelize.query("SELECT COUNT(*) as count " +
									"FROM brand_requests " +
									"WHERE deleted_at IS NULL", { type: sequelize.QueryTypes.SELECT })
	.then(function (results) {
		sequelize.query("SELECT COUNT(DISTINCT brand_id) as count " +
									"FROM brand_requests " +
									"WHERE deleted_at IS NULL", { type: sequelize.QueryTypes.SELECT })
		.then(function (result_unique) {
			res.json({
				count: results[0].count,
				count_brand_ids: result_unique[0].count
			})
		})
	})

})

app.get('/monthly_engaged_locations', function (req, res) {
	sequelize.query("SELECT E_first.event_year, E_first.event_month, DATE_ADD(MAKEDATE(E_first.event_year, 1), INTERVAL (E_first.event_month)-1 MONTH) AS date, COUNT(*) AS num_retailers_engaged FROM (SELECT E.retailer_id, E.event_year, E.event_month FROM (SELECT events.retailer_id AS retailer_id, YEAR(events.created_at) AS event_year, MONTH(events.created_at) AS event_month, events.created_at FROM events WHERE ((event_type = 'campaign' AND category = 'share' AND events.subcategory IN ('facebook', 'twitter', 'email', 'instagram', 'mobile_ad')) OR (event_type = 'campaign' AND category = 'install' AND events.subcategory = 'widget') OR (event_type = 'campaign' AND category = 'download' AND events.subcategory = 'asset')) AND events.created_at >= '2016-10-01' AND deleted_at IS NULL) AS E GROUP BY E.retailer_id, event_year, event_month ) AS E_first JOIN retailers ON retailers.id = E_first.retailer_id AND retailers.deleted_at IS NULL LEFT OUTER JOIN locations ON locations.locationable_type = 'Retailer' AND locations.deleted_at IS NULL AND locations.locationable_id = retailers.id GROUP BY E_first.event_year, E_first.event_month", { type: sequelize.QueryTypes.SELECT})
  .then(function(result) {
  	res.json(result)
  });
})

app.get('/engaged_locations', function (req, res) {
	sequelize.query("SELECT COUNT(*) as count FROM locations RIGHT OUTER JOIN retailers ON locations.locationable_type = 'Retailer' AND locations.locationable_id = retailers.id WHERE locations.deleted_at IS NULL AND retailers.id IN ( SELECT DISTINCT retailers.id FROM retailers JOIN permissions ON permissions.permissionable_type = 'Retailer' AND permissions.permissionable_id = retailers.id JOIN users ON users.id = permissions.user_id WHERE retailers.state = 'engaged' AND retailers.deleted_at IS NULL )", {type: sequelize.QueryTypes.SELECT})
	.then(function (results) {
		res.json(results[0])
	})
})

app.get('/arr', function (req, res) {
	arr.getARRSummary(function (summary) {
		res.json(summary)
	});
})


app.post('/brand', function (req, res) {
	//Check if the brand exists..
	var brandSlug = req.body.brand_slug;

	sequelize.query("SELECT * FROM brands WHERE slug = '" + brandSlug + "'", { type: sequelize.QueryTypes.SELECT })
		.then(function (brands) {
			if (!brands.length) {
				res.status(400).send("That brand doesn't exist. Stop it.")
				return;
			}

			if (req.body.celebrate) {
				celebrations.addCelebration(req.body.celebration_title, req.body.celebration_subtitle)
			}

			arr.updateBrand(req.body, function () {
				res.send("Good")
			})
		})
})

app.get('/celebration_reasons', function (req, res) {
	res.json(celebrations.getNextCelebration())
})

app.get('*', function (req, res) {
  res.sendFile('./public/index.html')
})



var timeNow = moment().subtract(moment().date()-1, 'days').format('YYYY-MM-DD');

app.listen(port);
console.log("App listening on port ", port);
