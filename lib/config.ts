import * as fs from 'mz/fs';
import * as fsp from 'path';

export interface Config {
    installed: any;
    tokens: any;
    refreshMinutes: number;
}

// ../.. because of .js is one level down, inside buid/lib
const configPath = fsp.join(__dirname, '../../client-secret.json');

export const config = {
    ...JSON.parse(fs.readFileSync(configPath, 'utf8')),
    refreshMinutes: 10,
    ...require('../../package').config,
} as Config;

export function saveConfig() {
    fs.writeFileSync(configPath, JSON.stringify(config, null, '  '), 'utf8');
    console.log(`${configPath}: saved config file`);
}