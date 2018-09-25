import * as request from 'supertest';
import { wait } from 'f-promise';
import { app } from '../lib/app';
import { Login } from '../lib/model/login';
import { assert } from 'chai';
require('f-mocha').setup();

const testEmail = 'test@acme.com';

describe('POST /createPassword', () => {
    it('200 if email registered with empty passord', () => {
        const testLicense = Login.createTestLogin(testEmail);
        const res = wait<request.Response>(cb => request(app)
            .get('/changePassword')
            .auth(testEmail, 'secret')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.equal(res.body.email, testEmail);
        assert.equal(res.body.license, testLicense);
    });
    it('401 if email not registered', () => {
        const res = wait<request.Response>(cb => request(app)
            .get('/changePassword')
            .auth('bad-' + testEmail, 'secret')
            .expect(401)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.match(res.body.error, /unknown login/);
    });
    it('401 if password already set', () => {
        Login.createTestLogin(testEmail);
        Login.changePassword(testEmail, 'secret');
        const res = wait<request.Response>(cb => request(app)
            .get('/changePassword')
            .auth(testEmail, 'secret')
            .expect(401)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.match(res.body.error, /password already set/);
    });
    it('401 if password too short', () => {
        Login.createTestLogin(testEmail);
        const res = wait<request.Response>(cb => request(app)
            .get('/changePassword')
            .auth(testEmail, 'secre')
            .expect(401)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.match(res.body.error, /password too short/);
    });
});

describe('GET /ping', () => {
    it('200 if email and password ok', () => {
        Login.createTestLogin(testEmail);
        Login.changePassword(testEmail, 'secret');
        const res = wait<request.Response>(cb => request(app)
            .get('/ping')
            .auth(testEmail, 'secret')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.deepEqual(res.body, {});
    });
    it('401 if email not registered', () => {
        const res = wait<request.Response>(cb => request(app)
            .get('/ping')
            .auth('bad-' + testEmail, 'secret')
            .expect(401)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.match(res.body.error, /unknown login/);
    });
    it('401 if password not set', () => {
        Login.createTestLogin(testEmail);
        const res = wait<request.Response>(cb => request(app)
            .get('/ping')
            .auth(testEmail, 'secret')
            .expect(401)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.match(res.body.error, /authentication failed/);
    });
    it('401 if password mismatch', () => {
        Login.createTestLogin(testEmail);
        Login.changePassword(testEmail, 'secret');
        const res = wait<request.Response>(cb => request(app)
            .get('/ping')
            .auth(testEmail, 'foobar')
            .expect(401)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.match(res.body.error, /authentication failed/);
    });
});
