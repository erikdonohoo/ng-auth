'use strict';

/* global urlRequiresAuth: false */
describe('url requires auth', function () {

	var settings;

	var auth = 'https://auth.mtc.byu.edu/oauth2/auth?client_id=2c7a14e2-09d0-44e2-a380-e6f200a4aa7b' +
		'&scope=https://api.mtc.byu.edu/mtc%20https://api.mtc.byu.edu/applicantmanager%20https://api.mtc' +
		'.byu.edu/standards&state=%2F&response_type=token&redirect_uri=http://localhost:9000/';
	beforeEach(function () {
		settings = {
			content_urls: [
				'http://place.com',
				'http://love.me'
			]
		};
	});

	it('should return true when a bad url is used', function () {
		expect(urlRequiresAuth('http://place.com/yohoo', settings)).toBe(true);
	});

	it('should return false when a good url is used', function () {
		expect(urlRequiresAuth('http://noprobhere.com/api', settings)).toBe(false);
	});

	it('should not think auth redirects need authentication', function () {
		settings.content_urls.push('https://api.mtc.byu.edu/applicantmanager');
		expect(urlRequiresAuth(auth, settings)).toBe(false);
	});

});
