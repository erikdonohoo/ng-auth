'use strict';

describe('$oauth2: saveToken', function () {

	/* global saveToken: false */
	/* global settings: false */
	/* global AUTH_SESSION_STORAGE_KEY: false */
	var token, $window, $http;
	beforeEach(inject(function (_$http_) {
		$window = {};
		$window.sessionStorage = {};
		$http = _$http_;
		token = {
			access_token: '0899101a-11ac-4781-a624-db4824658c35',
			expires_in: 3600
		};
		settings.client_id = '123';

		// Clear session sessionStorage
		for (var key in $window.sessionStorage) {
			delete $window.sessionStorage[key];
		}
	}));

	it('should set expires_at', function () {
		token = saveToken(token, $window);
		expect(token.expires_at).toBeDefined();
		var noMoreThan = Date.now() + (token.expires_in * 1000);
		expect(token.expires_at).toBeLessThan(noMoreThan);
	});

	it('should not change expires_at if it is already set', function () {
		var time = token.expires_at = 100000000;
		token = saveToken(token, $window);
		expect(token.expires_at).toBe(time);
	});

	it('should add an entry to sessionStorage', function () {
		expect($window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id])
		.toBeUndefined();
		token = saveToken(token, $window);
		expect(angular.fromJson($window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id]))
		.toEqual(token);
	});

	it('should not overwrite an existing entry in sessionStorage', function () {
		token = saveToken(token, $window);
		expect(angular.fromJson($window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id]))
		.toEqual(token);
		var token2 = angular.copy(token);
		token2.expires_in = 2000;
		token2 = saveToken(token2, $window);
		var fromStorage = angular.fromJson($window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id]);
		expect(fromStorage).toEqual(token2);
		expect(fromStorage.expires_at).toEqual(token.expires_at);
	});
});
