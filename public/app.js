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
						change: 0
					}
				}

				function toggleChange (key, change) {
					$scope.data[key].change = change;
					$timeout(function () {
						$scope.data[key].change = null;
					}, 1500)
				}

				function toggleCelebration () {
					$scope.data.celebration.on = true;

					$timeout(function () {
						$scope.data.celebration.on = false;		
					}, 3000)
				}

				function pingServer () {
					console.log('refreshing')

					toggleCelebration();

					$http.get('/retailers')
					.success(function (data) {
						$scope.data.retailers.count = data.num_retailers;
						toggleChange('retailers', 120)

					})
					.error(function (err) {
						console.warn(err)
					})

					$timeout(function () {
						pingServer();
					}, 100000)
				}


				function init () {
					$timeout(function () {
						pingServer();
					})
				}

				init();
			}
    });
  }])

