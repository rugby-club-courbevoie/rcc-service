import * as request from 'supertest';
import { wait } from 'f-promise';
import { app } from '../lib/app';
import { Login } from '../lib/model/login';
import { Category } from '../lib/model/category';
import { assert } from 'chai';
import { config } from '../lib/config';
require('f-mocha').setup();

describe('GET /categories', () => {
    it('returns valid data', () => {
        Login.createTestLogin('secret');
        const res = wait<request.Response>(cb => request(app)
            .get('/categories')
            .auth('test@acme.com', 'secret')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 5);
        res.body.forEach((category: Category) => {
            assert.isString(category.name);
            assert.match(category.name, /(^U\d+|Seniors|Vendredis)$/);
            assert.isNumber(category.year1);
            assert.isAtLeast(category.year1, 1910); // also checks that we are on test spreadsheet
        });
    });
});