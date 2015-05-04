(function (angular) {
	'use strict';
	angular.module('angular-oauth2', []);
	angular.module('angular-oauth2').constant('oauth2-key', 'angular-oauth2');

	function authmock() {

		authmock.prototype.configure = angular.noop;
		authmock.prototype.$get = ['$q', function ($q) {

			var service = {};
			var defer = $q.defer();
			service.registerCallback = service.lateConfig = service.authenticate = service.isAuthenticated =
				service.updateToken = service.getToken = angular.noop;
			service.tokenAvailable = defer.promise;

			service.getConfig = function () {
				return {
					clientId: 'AUTH_MOCK_ID'
				};
			};

			// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
			defer.resolve({
				accessToken: 'fake',
				expiresIn: 3600,
				scope: '/'
			});
			// jscs:enable requireCamelCaseOrUpperCaseIdentifiers

			return service;
		}];
	}

	angular.module('angular-oauth2').provider('$oauth2', [authmock]);

})(angular);
