import * as express from 'f-express';
import { config } from './config';
import { Database } from './database';
import { Category } from './model/category';
import { Licensee } from './model/licensee';
import { Presence } from './model/presence';
import { InternalError } from './util';
import * as bodyParser from 'body-parser';
import { authApp } from './auth-app';

export const app = express();

app.use((req, res, next) => {
    console.log("HTTP REQUEST", req.method, req.url, JSON.stringify(req.body || null));
    res.on('finish', () => console.log("HTTP RESPONSE", req.method, req.url, res.statusCode));
    next();
});

app.use(authApp);

interface PostResponse extends express.Response { body: any };

app.use(bodyParser.json());

app.get('/ping', (req, res) => {
    res.json({});
})

app.get('/categories', (req, res) => {
    const categories = Category.all;
    res.json(categories);
});

app.get('/licensees/:license', (req, res) => {
    const licensee = Licensee.find(req.params.license);
    res.json(licensee);
});

app.get('/presences', (req, res) => {
    const filter = {
        date: req.query.date,
        event: req.query.event,
        category: req.query.category,
        coachLicense: req.query.coachLicense,
    };
    let attendees = Presence.read(filter);
    if (attendees.length === 0) attendees = Presence.generate(filter);
    res.json(attendees);
});

app.put('/presences', (req, res: PostResponse) => {
    if (!Array.isArray(req.body)) {
        res.status(400).json('body is not an array');
        return;
    }
    Presence.updatePresence(req.body);
    res.json({});
});
