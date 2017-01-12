var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/pbxxtv');

var Schema = mongoose.Schema;
var brandSchema = new Schema({
  name: String,
  arr: Number
});
var Brand = mongoose.model('Brand', brandSchema);
var fs = require('fs');
var yaml = require('js-yaml');

var config_dir = __dirname + "/../config";
var revenue_config = yaml.load(fs.readFileSync(config_dir + "/revenue_config.yml", 'utf8'));

var _ = require('lodash')

function updateBrand (params, cb) {
	return Brand.findOne({
		name: params.brand_slug
	}, function (err, brand) {
		console.log(brand)

		params.arr = parseFloat(params.arr);

		if (!brand) {
			var newBrand = Brand({
				name: params.brand_slug,
				arr: params.arr
			})

			newBrand.save(function (err) {
				if (err) {
					console.log(err);
				}

				console.log("Successfully Created", newBrand)
				cb();
			})

		} else {
			//update
			brand.arr = params.arr;
			brand.save(function (err) {
				if (err) {
					console.log(err);
				}

				console.log("Successfully Updated", brand)
				cb();

			})

		}

	})
}


function getARRSummary (cb) {
	//sum ARR for all stored brands
	Brand.find({}, function (err, brands) {
		console.log(brands)

		var earnedARR = _.reduce(brands, function (total, brand) {
			return total + brand.arr;
		}, 0);

		cb({
			earnedARR: earnedARR,
			starting: revenue_config.starting,
			year_target: revenue_config.year_target,
			q1: revenue_config.q1,
			q2: revenue_config.q2,
			q3: revenue_config.q3,
			q4: revenue_config.q4
		})

	})
}



module.exports.updateBrand = updateBrand;
module.exports.getARRSummary = getARRSummary;