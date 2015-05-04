'use strict';

/* global stripToken: false */
describe('Strip token', function () {
	var path, token;
	beforeEach(function () {
		path = 'http://some.place/url';
		token = 'access_token=12345&expires_in=3600';
	});
	it('should parse params correctly', function () {
		path = path + '#' + token;
		expect(stripToken(path)).toEqual({
			access_token: '12345',
			expires_in: '3600'
		});
	});
	it('should handle additional /', function () {
		path = path + '#/' + token;
		expect(stripToken(path)).toEqual({
			access_token: '12345',
			expires_in: '3600'
		});
	});
	it('should return {} when no token is found', function () {
		expect(stripToken(path)).toEqual({});
	});
});
