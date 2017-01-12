var pbxxTv = angular.module('pbxxTv', [
	'ui.router'
		//ng-deps
])
.config(['$stateProvider', function($stateProvider) {
    $stateProvider.state("home", {
      url: '/',
      controller: function ($scope, $http, $timeout) {
				$scope.company = "Promoboxx";
				$scope.data = {
					celebration: {
						on: false,
						reason: "CELEBRATE, YOU FOOLS",
						subreason: "Run Frodo, bring the ring to Mt. Doom"
					},
					retailers: {
						count: 0,
						eligibleCount: 0,
						change: 0
					},
					brands: {
						active: 0,
						unlocked: 0,
						change: 0
					},
					brand_campaigns: {
						present: 0,
						past: 0,
						change: 0,
						percent_change: 0
					},
					cd_campaigns: {
						present: 0,
						past: 0,
						change: 0,
						percent_change: 0
					},
					shares: {
						facebook: {
							present: 0,
							past: 0,
							percent_change: 0
						},
						twitter: {
							present: 0,
							past: 0,
							percent_change: 0

						},
						change: 0
					},
					brand_requests: {
						count: 0,
						unique: 0,
						change: 0
					},
					engaged_billing_locations: {
						count: 0,
						change: 0
					},
					ad_runs: {
						total: 0,
						rf: 0,
						bf: 0,
						change: 0
					},
					engaged_locations: {
						present: {
							num_retailers_engaged: 0
						},
						past: {
							num_retailers_engaged: 0
						},
						billing_count: 0,
						percent_change: 0,
						change: 0
					}
				}

				$scope.metQuarterGoal = function (goal, base, earned) {
					return Math.abs(goal - base) <= earned
				}

				function toggleChange (key, change) {
					$scope.data[key].change = change;
					$timeout(function () {
						$scope.data[key].change = null;
					}, 1500)
				}

				function getPercentDiff (historic, current) {
					return (current - historic)/historic * 100;
				}

				function toggleCelebration () {
					//TODO: Re-enable eventually
					$scope.data.celebration.on = true;

					$timeout(function () {
						$scope.data.celebration.on = false;		
					}, 15000)
				}

				function pingServer () {
					console.log('refreshing')
					$scope.refreshed = true;

					//toggleCelebration();

					$http.get('/retailers')
					.success(function (data) {
						var engaged = _.find(data, function (row) { return row.state === 'engaged'}).num_retailers
						var eligible = _.find(data, function (row) { return row.state === 'eligible'}).num_retailers

						toggleChange('retailers', (engaged - $scope.data.retailers.count))
						$scope.data.retailers.count = engaged;
						$scope.data.retailers.eligibleCount = eligible
					})

					$http.get('/brand_campaigns')
					.success(function (data) {

						var concat_date = moment().format('YYYY-MM')
						var prev_date = moment().subtract(1, 'month').format('YYYY-MM')

						var present = _.find(data, function (row) { return row['date'] == concat_date})
						var past = _.find(data, function (row) { return row['date'] == prev_date})
						toggleChange('brand_campaigns', (present.campaigns_launched - $scope.data.brand_campaigns.present))

						$scope.data.brand_campaigns.present = present.campaigns_launched;
						$scope.data.brand_campaigns.past = past.campaigns_launched;

						$scope.data.brand_campaigns.percent_change = getPercentDiff(past.campaigns_launched, present.campaigns_launched)
					})

					$http.get('/cd_campaigns')
					.success(function (data) {

						var concat_date = moment().format('YYYY-MM')
						var prev_date = moment().subtract(1, 'month').format('YYYY-MM')

						var present = _.find(data, function (row) { return row['date'] == concat_date})
						var past = _.find(data, function (row) { return row['date'] == prev_date})
						toggleChange('cd_campaigns', (present.campaigns_launched - $scope.data.cd_campaigns.present))

						$scope.data.cd_campaigns.present = present.campaigns_launched;
						$scope.data.cd_campaigns.past = past.campaigns_launched;

						$scope.data.cd_campaigns.percent_change = getPercentDiff(past.campaigns_launched, present.campaigns_launched)
					})

					$http.get('/brands')
					.success(function (data) {
						var active = _.find(data, function (row) { return row.status === 'active'});
						var unlocked = _.find(data, function (row) { return row.status === 'unlocked'});
						toggleChange('brands', (active.brand_count - $scope.data.brands.active))
						$scope.data.brands.active = active.brand_count; 
						$scope.data.brands.unlocked = unlocked.brand_count;
					})

					$http.get('/monthly_engaged_locations')
					.success(function (data) {
						var present = data[data.length-1];
						var past = data[data.length-2]
						toggleChange('engaged_locations', (present.num_retailers_engaged - $scope.data.engaged_locations.present.num_retailers_engaged))
						$scope.data.engaged_locations.present = present;
						$scope.data.engaged_locations.past = past;
					})

					$http.get('/brand_requests')
					.success(function (data) {
						toggleChange('brand_requests', (data.count - $scope.data.brand_requests.count))
						$scope.data.brand_requests.count = data.count;
						$scope.data.brand_requests.unique = data.count_brand_ids;
					})

					$http.get('/engaged_locations')
					.success(function (data) {
						toggleChange('engaged_billing_locations', (data.count - $scope.data.engaged_billing_locations.count))
						$scope.data.engaged_billing_locations.count = data.count;
					})

					$http.get('/arr')
					.success(function (data) {
						console.log(data)
						$scope.data.arr = data;
					})

					$http.get('/ad_runs')
					.success(function (data) {
						console.log(data)
						var rf = _.find(data, function (r) { return r['is_rf'] === 1}).count;
						var bf = _.find(data, function (r) { return r['is_rf'] === 0}).count;
						var sum = rf + bf;
						toggleChange('ad_runs', (sum - $scope.data.ad_runs.total))
						$scope.data.ad_runs.total = sum;
						$scope.data.ad_runs.rf = rf;
						$scope.data.ad_runs.bf = bf;

					})

					$http.get('/celebration_reasons')
					.success(function (data) {
						if (data) {
							$scope.data.celebration.reason = data.title;
							$scope.data.celebration.subreason = data.subtitle
							toggleCelebration();
						}
					})

					$http.get('/shares')
					.success(function (data) {
						var concat_date = moment().format('YYYY-MM')
						var prev_date = moment().subtract(1, 'month').format('YYYY-MM')

						var fbpresent = _.find(data, function (row) { return row['date'] == concat_date && row['type'] === 'facebook'}).num_shares_made
						var fbpast = _.find(data, function (row) { return row['date'] == prev_date && row['type'] === 'facebook'}).num_shares_made

						var twpresent = _.find(data, function (row) { return row['date'] == concat_date && row['type'] === 'twitter'}).num_shares_made
						var twpast = _.find(data, function (row) { return row['date'] == prev_date && row['type'] === 'twitter'}).num_shares_made

						var sum = fbpresent + twpresent;
						var storedSum = $scope.data.shares.facebook.present + $scope.data.shares.twitter.present;

						toggleChange('shares', (sum - storedSum))
						$scope.data.shares.facebook.present = fbpresent;
						$scope.data.shares.facebook.past = fbpast;
						$scope.data.shares.twitter.present = twpresent;
						$scope.data.shares.twitter.past = twpast;

						$scope.data.shares.facebook.percent_change = getPercentDiff(fbpast, fbpresent)
						$scope.data.shares.twitter.percent_change = getPercentDiff(twpast, fbpresent)

					})

					$timeout(function () {
						$scope.refreshed = false;
						pingServer();
					}, 60000)
				}


				function init () {
					$timeout(function () {
						pingServer();
					})

					$scope.date = moment().format();

					$scope.thisMonth = moment().month()+1;
				}

				init();
			}
    })
		.state('updater', {
			url: '/update',
			templateUrl: 'update-form.tmpl.html',
			controller: function ($scope, $http) {

				$scope.data = {
					brand_slug: null,
					arr: null,
					celebrate: false,
					celebration_title: null,
					celebration_subtitle: null
				}

				$scope.submit = function () {

					if (!$scope.data.brand_slug || !$scope.data.arr) {
						console.warn("Why did you enter in nothing? ...");
						return;
					}

					$http.post('/brand', $scope.data)
						.success(function () {
							console.log("gewd")
						})
						.error(function (err) {
							console.warn("badd", err)
						})
				}

			}
		})
  }])

