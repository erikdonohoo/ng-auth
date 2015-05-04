'use strict';

/* global settings: false */
/* global AUTH_SESSION_STORAGE_KEY: false */
/* global buildUrl: false */
describe('$oauth', function () {

	var $oauth2Provider;
	beforeEach(module('ng-auth', function (_$oauth2Provider_) {
		$oauth2Provider = _$oauth2Provider_;
	}));

	function reset() {
		settings.oauth2_url = null;
		settings.redirect_uri = null;
		settings.client_id = null;
		settings.redirecting = false;
		settings.content_urls = [];
		settings.popup = false;
		settings.scope = [];
		settings.options = {};
		settings.auto_auth = true;
		settings.state = null;
	}

	var $provide;
	beforeEach(module(function (_$provide_) {
		$provide = _$provide_;

		$provide.value('$window', {
			location: {
				origin: 'http://my.cool.site.com',
				pathname: '/stuff/',
				hash: '#/place/1/things',
				href: 'http://my.cool.site.com/stuff/#/place/1/things'
			},
			sessionStorage: {},
			document: document
		});
	}));

	describe('Provider', function () {

		afterEach(function () {
			reset();
		});

		it('should configure the settings object correctly', inject(function () {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			expect(settings.client_id).toBe('12345');
			expect(settings.redirect_uri).toBe('http://stuff.com');
			expect(settings.oauth2_url).toBe('http://authy.com');
		}));
		it('should allow multiple calls to set configuration', function () {
			$oauth2Provider.configure({
				contentUrls: ['http://super.secret']
			});
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://also.secret']
			});
			expect(settings.client_id).toBe('12345');
			expect(settings.redirect_uri).toBe('http://stuff.com');
			expect(settings.oauth2_url).toBe('http://authy.com');
			expect(settings.content_urls).toEqual([
				'http://super.secret',
				'http://also.secret'
			]);
		});
		it('should handle scopes correctly', function () {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				scope: ['https://some.api', 'https://other.api']
			});
			$oauth2Provider.configure({
				scope: ['https://cool.api']
			});
			expect(settings.scope).toEqual(['https://some.api', 'https://other.api', 'https://cool.api']);
		});
		it('should handle auto-auth correctly', function () {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				scope: ['https://some.api', 'https://other.api'],
				autoAuth: false
			});
			expect(settings.auto_auth).toBe(false);
		});
		it('should leave auto_auth true if not set', function () {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				scope: ['https://some.api', 'https://other.api']
			});
			expect(settings.auto_auth).toBe(true);
		});
	});

	describe('Service', function () {
		var $scope, $window, $http;
		beforeEach(inject(function ($rootScope, _$window_, _$httpBackend_) {
			$scope = $rootScope;
			$window = _$window_;
			$http = _$httpBackend_;
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			reset();
		}));

		afterEach(function () {
			reset();
		});

		it('should not allow duplicates in scope and contentUrls', function () {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'https://stuff.com',
				oauth2Url: 'https://auth.com',
				scope: ['https://code.com', 'https://code.com'],
				contentUrls: ['https://api.com', 'https://api.com']
			});
			expect(settings.scope.length).toBe(1);
			expect(settings.content_urls.length).toBe(1);
		});

		it('should try to redirect automatically if auto_auth is true', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			$injector.invoke($oauth2Provider.$get);
			expect($window.location.href)
			.toBe('http://authy.com?client_id=12345&response_type=token&redirect_uri=http://stuff.com');
		}));
		it('should not redirect if auto_auth is false', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				autoAuth: false
			});
			$injector.invoke($oauth2Provider.$get);
			expect($window.location.href)
			.toBe('http://my.cool.site.com/stuff/#/place/1/things');
		}));
		it('should allow adding configuration during runtime', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				autoAuth: false
			});
			$injector.invoke($oauth2Provider.$get);
			var $oauth2 = $injector.get('$oauth2');
			$oauth2.lateConfig({
				contentUrls: ['https://api.com']
			});
			expect(settings.content_urls.length).toBe(1);
			expect(settings.content_urls[0]).toBe('https://api.com');
		}));
		it('should error if required configs are missing', inject(function ($injector) {
			$oauth2Provider.configure({
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			function start() {
				$injector.invoke($oauth2Provider.$get);
			}
			expect(start).toThrow();
			reset();
			$oauth2Provider.configure({
				clientId: '12345',
				oauth2Url: 'http://authy.com'
			});
			expect(start).toThrow();
			reset();
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com'
			});
			expect(start).toThrow();
		}));
		it('should find the token on the url and save all required data', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			angular.element(document.querySelectorAll('body')).attr('oauth-hide', '');
			expect(angular.element($window.document).find('body').attr('oauth-hide')).toBeDefined();
			$window.location.href = 'http://myurl.com/page/#access_token=55555&expires_in=3600&state=%2Fpath%2F1%2Fstuff';
			var $oauth2 = $injector.invoke($oauth2Provider.$get);
			var token = $oauth2.getToken();
			// Should remove oauth-hide attribute
			expect(angular.element($window.document).find('body').attr('oauth-hide')).toBeUndefined();
			expect(token).toBeDefined();
			expect(token.access_token).toBe('55555');
			expect(token.expires_in).toBe('3600');
			expect(token.state).toBe('/path/1/stuff');
		}));
		it('should handle complex state paths', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			$window.location.href = 'http://myurl.com/page/#access_token=55555&expires_in=3600&state=%2Fpath%2F1%2Fstuff?thing=you#stuff';
			$window.location.hash = '#access_token=55555&expires_in=3600&state=%2Fpath%2F1%2Fstuff?thing=you#stuff';
			$injector.invoke($oauth2Provider.$get);
			var $location = $injector.get('$location');
			expect($location.search().thing).toBe('you');
			expect($location.hash()).toBe('stuff');
		}));
		it('should handle state paths without hash', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			var $location = $injector.get('$location');
			$window.location.href = 'http://myurl.com/page/#access_token=55555&expires_in=3600&state=%2Fpath%2F1%2Fstuff?thing=you';
			$window.location.hash = '#access_token=55555&expires_in=3600&state=%2Fpath%2F1%2Fstuff?thing=you';
			$injector.invoke($oauth2Provider.$get);
			expect($location.search().thing).toBe('you');
			expect($location.hash()).toBe('');
		}));
		it('should work with no state supplied', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			$window.location.href = 'http://myurl.com/page#/access_token=55555&expires_in=3600';
			$window.location.hash = '#/access_token=55555&expires_in=3600';
			var $oauth2 = $injector.invoke($oauth2Provider.$get);
			var $location = $injector.get('$location');
			expect($oauth2.getToken().access_token).toBe('55555');
			expect($location.hash()).toBe('');
		}));
		it('should set the $location.path with no hash', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			$window.location.href = 'http://myurl.com/page#/access_token=55555&expires_in=3600';
			$window.location.hash = '#/access_token=55555&expires_in=3600&state=%F2goo';
			$injector.invoke($oauth2Provider.$get);
			var $location = $injector.get('$location');
			expect($location.hash()).toBe('');
		}));
		it('should stay authenticated if we were previously and its still valid', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 1000
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);
			expect(settings.redirecting).toBe(false);
			expect($window.location.href).toBe('http://my.cool.site.com/stuff/#/place/1/things');
		}));
		it('should re-authenticate if saved token is expired', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now()
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			var $oauth2 = $injector.invoke($oauth2Provider.$get);
			expect(settings.redirecting).toBe(true);
			expect($oauth2.wasAuthenticated()).toBe(true);
		}));
		it('should intercept requests to protected resources', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com']
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 1000
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);

			$http.expectGET('http://secret.com/api/stuff', {
				Authorization: 'Bearer 55555',
				Accept: 'application/json, text/plain, */*'
			})
			.respond({
				id: 1
			});
			var $h = $injector.get('$http');
			$h.get('http://secret.com/api/stuff');
			$http.flush();
		}));
		it('should not validate requests to non protected prefixes', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com']
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 1000
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);

			$http.expectGET('http://cool.com/api/stuff', {
				Accept: 'application/json, text/plain, */*'
			})
			.respond({
				id: 1
			});
			var $h = $injector.get('$http');
			$h.get('http://cool.com/api/stuff');
			$http.flush();
		}));
		it('should not allow requests until authentication occurs', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com'],
				autoAuth: false
			});
			$injector.invoke($oauth2Provider.$get);

			$http.expectGET('http://secret.com/api/stuff', {
				Accept: 'application/json, text/plain, */*'
			})
			.respond({
				id: 1
			});
			var $h = $injector.get('$http');
			var err = jasmine.createSpy('err');
			$h.get('http://secret.com/api/stuff').catch(err);
			$scope.$digest();
			expect(err).toHaveBeenCalled();
			$http.verifyNoOutstandingRequest();
		}));
		it('should try to update token if it is exired, and use update for request', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com']
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 100
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);
			var $oauth2 = $injector.get('$oauth2');
			var $q = $injector.get('$q');

			// Make token expired
			token.expires_at = Date.now();
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);

			// Watch update token
			spyOn($oauth2, 'updateToken').and.callFake(function () {
				var token2 = angular.copy(token);
				token2.access_token = '66666';
				token2.expires_at = Date.now() + 3600 * 1000;
				return $q.when(token2);
			});

			$http.expectGET('http://secret.com/api/stuff', {
				Accept: 'application/json, text/plain, */*',
				Authorization: 'Bearer 66666'
			})
			.respond({});
			$injector.get('$http').get('http://secret.com/api/stuff');
			$http.flush();
			expect($oauth2.updateToken).toHaveBeenCalled();
		}));
		it('should reject if token couldnt be updated and cancel original request', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com']
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 100
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);
			var $oauth2 = $injector.get('$oauth2');
			var $q = $injector.get('$q');

			// Make token expired
			token.expires_at = Date.now();
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);

			// Watch update token
			spyOn($oauth2, 'updateToken').and.callFake(function () {
				return $q.reject('couldnt get token');
			});

			$injector.get('$http').get('http://secret.com/api/stuff');
			expect($http.flush).toThrow();
		}));
		it('should get settings configuration back at runtime', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com']
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 100
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);
			var $oauth2 = $injector.get('$oauth2');

			expect(settings).toEqual($oauth2.getConfig());
		}));
		it('should update token', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com']
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 100
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);
			var $oauth2 = $injector.get('$oauth2');

			var url = buildUrl(settings, $injector.get('$location'));
			$http.expectGET(url)
			.respond({
				access_token: '77777',
				expires_in: '3600'
			});
			$oauth2.updateToken();
			$http.flush();
		}));
		it('should try to authenticate if it cant update token', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com']
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 100
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);
			var $oauth2 = $injector.get('$oauth2');

			spyOn($oauth2, 'authenticate');
			var url = buildUrl(settings, $injector.get('$location'));
			$http.expectGET(url)
			.respond(400);
			$oauth2.updateToken();
			$http.flush();
			expect($oauth2.authenticate).toHaveBeenCalled();
		}));
		it('should fail to update token if response isnt pareable as json', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com']
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 100
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);
			var $oauth2 = $injector.get('$oauth2');

			spyOn($oauth2, 'authenticate');
			var url = buildUrl(settings, $injector.get('$location'));
			$http.expectGET(url)
			.respond('<div>yo</div>');
			$oauth2.updateToken().then(function () {}, function (reason) {
				expect(reason).toBe('Token was not received as JSON');
			});
			$http.flush();
		}));
		it('should call registered callback when token is found on url', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com'
			});
			$window.location.href = 'http://myurl.com/page#/access_token=55555&expires_in=3600';
			$window.location.hash = '#/access_token=55555&expires_in=3600&state=%F2goo';
			$injector.invoke($oauth2Provider.$get);
			var $oauth2 = $injector.get('$oauth2');
			var obj = {
				method: function () {}
			};
			spyOn(obj, 'method');
			$oauth2.registerCallback(obj.method);
			expect(obj.method).toHaveBeenCalled();
		}));
		it('should not call registered functions if token is not on path', inject(function ($injector) {
			$oauth2Provider.configure({
				clientId: '12345',
				redirectUri: 'http://stuff.com',
				oauth2Url: 'http://authy.com',
				contentUrls: ['http://secret.com']
			});
			var token = {
				access_token: '55555',
				expires_in: '3600',
				expires_at: Date.now() + 3600 * 100
			};
			$window.sessionStorage[AUTH_SESSION_STORAGE_KEY + '-' + settings.client_id] = angular.toJson(token);
			$injector.invoke($oauth2Provider.$get);
			var $oauth2 = $injector.get('$oauth2');
			var obj = {
				method: function () {}
			};
			spyOn(obj, 'method');
			$oauth2.registerCallback(obj.method);
			expect(obj.method).not.toHaveBeenCalled();
		}));
	});
});
