import * as request from 'supertest';
import { wait } from 'f-promise';
import { app } from '../lib/app';
import { Presence } from '../lib/model/presence';
import { Login } from '../lib/model/login';
import { assert } from 'chai';
import { config } from '../lib/config';
require('f-mocha').setup();

const coachLicense = '1988011947404';
const testDate = '2017-09-20';

describe('GET /presences', () => {
    it('returns valid data', () => {
        Login.createTestLogin('secret');
        const res = wait<request.Response>(cb => request(app)
            .get(`/presences?event=training&category=U12&date=${testDate}&coachLicense=${coachLicense}`)
            .auth('test@acme.com', 'secret')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 5);
        res.body.forEach((p: Presence) => {
            assert.equal(p.category, 'U12');
            assert.equal(p.coachLicense, coachLicense);
            assert.isString(p.coachName);
            assert.equal(p.date, testDate);
            assert.equal(p.event, 'training');
            assert.equal(p.excused, false);
            assert.equal(p.excusedBy, '');
            assert.equal(p.excusedReason, '');
            assert.equal(p.excusedStamp, '');
            assert.isString(p.playerLicense);
            assert.isString(p.playerName);
            assert.isBoolean(p.present);
            //assert.equal(p.presentStamp, '');
        });
    });
});

describe('PUT /presences', () => {
    it('updates', () => {
        Login.createTestLogin('secret');
        const get1Res = wait<request.Response>(cb => request(app)
            .get(`/presences?event=training&category=U12&date=${testDate}&coachLicense=${coachLicense}`)
            .auth('test@acme.com', 'secret')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.isArray(get1Res.body);
        assert.isAtLeast(get1Res.body.length, 5);

        const put1Res = wait<request.Response>(cb => request(app)
            .put(`/presences`)
            .auth('test@acme.com', 'secret')
            .send([{
                ...get1Res.body[0], present: false
            }, {
                ...get1Res.body[1], present: true
            }])
            .expect(200)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.isObject(put1Res.body);

        const get2Res = wait<request.Response>(cb => request(app)
            .get(`/presences?event=training&category=U12&date=${testDate}&coachLicense=${coachLicense}`)
            .auth('test@acme.com', 'secret')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(cb));
        assert.isArray(get2Res.body);
        assert.isAtLeast(get2Res.body.length, 5);
        assert.strictEqual(get2Res.body[0].present, false);
        assert.strictEqual(get2Res.body[1].present, true);
    });
});
