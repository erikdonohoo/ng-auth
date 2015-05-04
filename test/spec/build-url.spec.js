'use strict';

/* global buildUrl: false */
describe('build url', function () {
	var config, location;
	beforeEach(function () {
		config = {
			client_id: '12345',
			oauth2_url: 'https://auth.co',
			redirect_uri: 'http://me.com',
			state: 'mystate',
			scope: []
		};
		location = {
			url: function () { return '/place/1/things'; },
			hash: function () { return '/place/1/things'; },
			absUrl: function () { return 'http://my.cool.site.com/stuff/#/place/1/things'; }
		};
	});

	it('should use the state string if supplied, or else the hash', function () {
		expect(buildUrl(config, location))
		.toBe('https://auth.co?client_id=12345&state=mystate&response_type=token&redirect_uri=http://me.com');
	});
	it('should produce a url that is expected', function () {
		config.state = true;
		config.redirect_uri = true;
		expect(buildUrl(config, location))
		.toBe('https://auth.co?client_id=12345&state=%2Fplace%2F1%2Fthings&response_type=token&redirect_uri=http://my.cool.site.com/stuff/');
	});
	it('should not modify the config it was passed', function () {
		var copy = angular.copy(config);
		buildUrl(config, location);
		expect(copy).toEqual(config);
	});
	it('should add options correctly as query params', function () {
		config.options = {
			thing: 1,
			stuff: 2
		};
		expect(buildUrl(config, location))
		.toBe('https://auth.co?client_id=12345&state=mystate&response_type=token&redirect_uri=http://me.com&thing=1&stuff=2');
	});
	it('should handle scopes', function () {
		config.scope = ['http://api.com', 'http://other.com'];
		expect(buildUrl(config, location))
		.toBe('https://auth.co?client_id=12345&scope=http://api.com%20http://other.com&' +
			'state=mystate&response_type=token&redirect_uri=http://me.com');
	});
	it('should handle no state', function () {
		config.state = null;
		expect(buildUrl(config, location))
		.toBe('https://auth.co?client_id=12345&response_type=token&redirect_uri=http://me.com');
	});
});
