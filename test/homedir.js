'use strict';

var os = require('os');
var test = require('tape');
var mockProperty = require('mock-property');

var envKeys = ['HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'LOGNAME', 'USER', 'LNAME', 'USERNAME'];

function clearEnv(t) {
	for (var i = 0; i < envKeys.length; i++) {
		t.teardown(mockProperty(process.env, envKeys[i], { 'delete': true }));
	}
}

function getFallback(t) {
	t.teardown(mockProperty(os, 'homedir', { value: undefined }));

	var homedirPath = require.resolve('../lib/homedir');
	t.teardown(mockProperty(require.cache, homedirPath, { 'delete': true }));

	return require('../lib/homedir');
}

test('homedir fallback', function (t) {
	t.test('win32: HOMEDRIVE without HOMEPATH does not produce a false concatenation', function (st) {
		clearEnv(st);
		st.teardown(mockProperty(process, 'platform', { value: 'win32' }));

		var homedir = getFallback(st);

		st.teardown(mockProperty(process.env, 'HOMEDRIVE', { value: 'C:' }));

		st.equal(homedir(), null, 'returns null when only HOMEDRIVE is set');

		st.end();
	});

	t.test('win32: HOMEPATH without HOMEDRIVE does not produce a false concatenation', function (st) {
		clearEnv(st);
		st.teardown(mockProperty(process, 'platform', { value: 'win32' }));

		var homedir = getFallback(st);

		st.teardown(mockProperty(process.env, 'HOMEPATH', { value: '\\Users\\foo' }));

		st.equal(homedir(), null, 'returns null when only HOMEPATH is set');

		st.end();
	});

	t.test('win32: HOMEDRIVE + HOMEPATH both set returns concatenation', function (st) {
		clearEnv(st);
		st.teardown(mockProperty(process, 'platform', { value: 'win32' }));

		var homedir = getFallback(st);

		st.teardown(mockProperty(process.env, 'HOMEDRIVE', { value: 'C:' }));
		st.teardown(mockProperty(process.env, 'HOMEPATH', { value: '\\Users\\foo' }));

		st.equal(homedir(), 'C:\\Users\\foo', 'returns concatenated drive and path');

		st.end();
	});

	t.test('win32: USERPROFILE takes precedence over HOMEDRIVE+HOMEPATH', function (st) {
		clearEnv(st);
		st.teardown(mockProperty(process, 'platform', { value: 'win32' }));

		var homedir = getFallback(st);

		st.teardown(mockProperty(process.env, 'USERPROFILE', { value: 'C:\\Users\\bar' }));
		st.teardown(mockProperty(process.env, 'HOMEDRIVE', { value: 'C:' }));
		st.teardown(mockProperty(process.env, 'HOMEPATH', { value: '\\Users\\foo' }));

		st.equal(homedir(), 'C:\\Users\\bar', 'returns USERPROFILE');

		st.end();
	});

	t.test('win32: falls back to HOME when HOMEDRIVE/HOMEPATH are partial', function (st) {
		clearEnv(st);
		st.teardown(mockProperty(process, 'platform', { value: 'win32' }));

		var homedir = getFallback(st);

		st.teardown(mockProperty(process.env, 'HOME', { value: 'C:\\Users\\baz' }));
		st.teardown(mockProperty(process.env, 'HOMEDRIVE', { value: 'C:' }));

		st.equal(homedir(), 'C:\\Users\\baz', 'falls back to HOME');

		st.end();
	});

	t.end();
});
