import { HttpError } from './util';
import { Request, Response, NextFunction } from 'express';
import { Login } from './model/login';
import { Factory } from './factory';

export function authApp(req: Request, res: Response, next: NextFunction) {
    try {
        Factory.init();
        const authorization = req.header('authorization');
        if (!authorization) throw new HttpError(401, `Authorization header missing`);
        const m = /^Basic\s*(.*)$/.exec(authorization);
        if (!m) throw new HttpError(401, `Malformed authorization header (1)`);
        const [email, password] = new Buffer(m[1], 'base64').toString().split(':');
        if (!email || !password) throw new HttpError(401, `Malformed authorization header (2)`);
        if (req.url === '/changePassword') {
            const login = Login.changePassword(email, password);
            res.json({
                email: login.email,
                license: login.license,
            });
        } else {
            Login.checkPassword(email, password);
            next();
        }
    } catch (ex) {
        console.error(ex.status ? `Error ${ex.status}: ${ex.message}` : ex.stack);
        res.status(ex.status || 500).json({ error: ex.message });
    }
}