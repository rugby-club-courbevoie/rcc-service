import { wait } from 'f-promise';
import { OAuth2, getAuthToken } from './google-auth';
import { InternalError, withTrace } from './util';

var google = require('googleapis');
var sheets = google.sheets('v4');

export interface RowChange {
    row: number;
    data: any[];
}

export class Database {
    static auth: OAuth2;

    static readAll(spreadsheetId: string, sheet: string) {
        if (!this.auth) throw new Error('cannot read: auth missing');
        return withTrace(`GOOGLE READ ALL ${sheet}`, () => {
            const response = wait<any>(cb => sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                auth: this.auth,
                range: encodeURIComponent(sheet),
            }, cb));
            return response.values as any[][];
        });
    }
    static update(spreadsheetId: string, sheet: string, changes: RowChange[]) {
        if (!this.auth) throw new Error('cannot read: auth missing');
        return withTrace(`GOOGLE UPDATE ${sheet}: ${changes.length} rows`, () => {
            const response = wait<any>(cb => sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: spreadsheetId,
                auth: this.auth,
                resource: {
                    valueInputOption: 'RAW',
                    data: changes.map(change => ({
                        range: `${sheet}!A${change.row}:X${change.row}`,
                        values: [change.data]
                    })),
                    includeValuesInResponse: true,
                }
            }, cb));
        });
        //console.log("UPDATE RESPONSE", response);
    }

    static init() {
        if (this.auth) return false;
        this.auth = getAuthToken();
        return true;
    }
}