import { run } from 'f-promise';
import { renewToken } from './google-auth';

run(() => renewToken()).catch(err => { console.error(err); });