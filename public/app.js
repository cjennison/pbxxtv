var pbxxTv = angular.module('pbxxTv', [
		//ng-deps
	])

function mainController ($scope, $http) {
	$scope.company = "Promoboxx";
	$scope.data = {
		retailerCount: 0
	}

	function pingServer () {
		console.log('refreshing')

		$http.get('/retailers')
		.success(function (data) {
			$scope.data.retailerCount = data.num_retailers;
		})
		.error(function (err) {
			console.warn(err)
		})

		setTimeout(function () {
			pingServer();
		}, 100000)
	}


	function init () {
		pingServer();
	}

	init();
}