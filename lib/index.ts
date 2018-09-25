import { run } from 'f-promise';
import { app } from './app';

/*
function test() {
    const categories = Category.all;
    console.log("CATEGORIES", categories);
    const licencees = Licensee.all;
    console.log("LICENSEES", licencees);
}*/

const host = '0.0.0.0';
//const host = 'localhost';
const port = 8124;

app.listen(port, host, (err: Error) => {
    if (err) throw err;
    console.log(`service listening on http://${host}:${port}/`)
});
