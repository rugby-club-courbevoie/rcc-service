import { context } from 'f-promise';
import { column, sheet, Record, type } from '../factory';
import { Database } from '../database';
import { HttpError } from '../util';
import { createHash } from 'crypto';

// VERY IMPORTANT: turn debug off before publish
const debug = false;
if (debug) console.error('!!! WARNING: running authentication in UNSAFE debug mode !!!');
const minPasswordLength = 6;

export const spreadsheetIds = {
    prod: '1yIZliWZ7cdTzd3njvrgYuahkLxWEVR9HzDucstNzVHI',
    test: '1i3ptOLQAI9DeoLFzhEuYfrkfaCyrfUnsD2j-1QuN3Lw',
}

export const testEmail = 'test@acme.com';

@sheet('Logins')
export class Login extends Record {
    @column('Licence')
    license: string;

    @column('Email')
    email: string;

    @column('Seed')
    seed: string;

    @column('Password')
    password: string;

    private static get all() {
        return this.factory.readAll<Login>();
    }

    private static find(email: string) {
        const login = this.all.filter(l => l.email.toLowerCase() === email)[0];
        if (!login) throw new HttpError(401, `unknown login: ${email}`);
        return login;
    }

    private static hash(email: string, seed: string, password: string) {
        const str = `${email.toLowerCase()}/${seed}/${password}`;
        return createHash('sha256').update(str).digest('base64');
    }

    private static persist(license: string, email: string, seed: string, password: string) {
        this.factory.update([{
            license: license,
            email: email,
            seed: seed,
            password: password,
        }],
            (src, dst) => src.email.toLowerCase() === dst.email.toLocaleLowerCase(),
            (src, dst) => {
                dst.license = src.license;
                dst.email = src.email;
                dst.seed = src.seed;
                dst.password = src.password;
            }, true);
    }

    static setContext(email: string) {
        context().spreadsheetId = /^test@/.test(email) ? spreadsheetIds.test : spreadsheetIds.prod;
    }

    static changePassword(email: string, password: string) {
        this.setContext(email);
        this.factory.invalidate();
        const login = this.find(email.toLowerCase());
        if (!debug && login.password) throw new HttpError(401, `${email}: password already set; cannot change it`);
        if (password.length < minPasswordLength) throw new HttpError(401, `${email}: password too short: ${password.length}`);
        const seed = '' + Math.round(Math.random() * 1e15);
        this.persist(login.license, email, seed, this.hash(email, seed, password));
        return login;
    }

    static checkPassword(email: string, password: string) {
        this.setContext(email);
        const login = this.find(email.toLowerCase());
        const hash = this.hash(email, login.seed, password);
        if (hash !== login.password) throw new HttpError(401, `authentication failed: ${email}`);
    }

    static createTestLogin(password?: string) {
        this.setContext(testEmail);
        Database.init();
        const license = '1234567890123';
        this.persist(license, testEmail, '', '');
        if (password) this.changePassword(testEmail, password);
        return license;
    }
}

