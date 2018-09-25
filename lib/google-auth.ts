import { install as sourceMapsSetup } from 'source-map-support';
import { Config, config, saveConfig } from './config';
sourceMapsSetup();

import { wait, run } from 'f-promise';
import * as fs from 'mz/fs';
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export interface OAuth2 {
    generateAuthUrl(arg: any): any;
    getToken(code: string, cb: (err: Error, tok: AuthToken) => void): void;
    credentials: any;
}
export interface AuthToken { }

function newOAuth2Client(credentials: Config): OAuth2 {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    return new auth.OAuth2(clientId, clientSecret, redirectUrl);
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials: Config): OAuth2 {
    var oauth2Client = newOAuth2Client(credentials);

    // Check if we have previously stored a token.
    if (!credentials.tokens) {
        throw new Error(`google token missing in config file`);
        //return getNewToken(oauth2Client);
    }
    oauth2Client.credentials = credentials.tokens;
    return oauth2Client;
}

export function renewToken() {
    config.tokens = getNewToken();
    saveConfig();
}

function getNewToken() {
    var oauth2Client = newOAuth2Client(config);
    return wait<AuthToken>(cb => {
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        console.log('Authorize this app by visiting this url: ', authUrl);
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Enter the code from that page here: ', function (code: string) {
            rl.close();
            oauth2Client.getToken(code, function (err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    return;
                }
                cb(null, token);
            });
        });
    });
}

export function getAuthToken() {
    return authorize(config);
}
