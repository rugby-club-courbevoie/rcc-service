import { column, sheet, Record, parse, format, type, ouiNon } from '../factory';
import { HttpError } from '../util';

@sheet('Licenciés')
export class Licensee extends Record {
    @column('Licence')
    license: string;

    @column('Statut')
    @parse(s => s === 'Actif')
    @format(v => v ? 'Actif' : 'Inactif')
    active: boolean;

    @column('Nom')
    lastName: string;

    @column('Prénom')
    firstName: string;

    @column('Sexe')
    @parse(s => s === 'Masculin' ? 'M' : 'F')
    @format(v => v === 'M' ? 'Masculin' : 'Féminin')
    sex: 'M' | 'F';

    @column('Date naissance')
    dob: string;

    @column('Email')
    email: string;

    @column('Adresse')
    street: string;

    @column('Ville')
    city: string;

    @column('Dirigeant')
    @ouiNon
    isStaff: boolean;

    @column('Entraineur')
    @ouiNon
    isCoach: boolean;

    @column('Nom parent 1')
    parent1LastName: string;

    @column('Prénom parent 1')
    parent1FirstName: string;

    @column('Email parent 1')
    parent1Email: string;

    @column('Téléphone parent 1')
    parent1Phone: string;

    @column('Nom parent 2')
    parent2LastName: string;

    @column('Prénom parent 2')
    parent2FirstName: string;

    @column('Email parent 2')
    parent2Email: string;

    @column('Téléphone parent 2')
    parent2Phone: string;

    static get all() {
        return this.factory.readAll<Licensee>();
    }

    static find(license: string) {
        const licensee = this.all.filter(l => l.license === license)[0];
        if (!licensee) throw new HttpError(404, `licensee not found: ${license}`);
        return licensee

    }
}
