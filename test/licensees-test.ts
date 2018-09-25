import * as request from 'supertest';
import { wait } from 'f-promise';
import { app } from '../lib/app';
import { Login } from '../lib/model/login';
import { Category } from '../lib/model/category';
import { assert } from 'chai';
import { config } from '../lib/config';
require('f-mocha').setup();

describe('GET /licensees/lic', () => {
    it('returns valid data', () => {
        Login.createTestLogin('secret');
        const res = wait<request.Response>(cb => request(app)
            .get('/licensees/2006101900070')
            .auth('test@acme.com', 'secret')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.isObject(res.body);
        assert.equal(res.body.license, '2006101900070');
        assert.equal(res.body.firstName, 'Belle');
        assert.equal(res.body.lastName, 'MacFadzean');
    });
});