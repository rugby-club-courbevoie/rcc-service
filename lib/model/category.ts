import { column, sheet, Record, type } from '../factory';
import { InternalError } from '../util';

@sheet('Catégories')
export class Category extends Record {
    @column('Nom')
    name: string;

    @column('Année 1')
    @type('number')
    year1: number;

    @column('Année 2')
    @type('number')
    year2: number;

    @column('Année 3')
    @type('number')
    year3: number;

    static get all() {
        return this.factory.readAll<Category>();
    }

    static find(name: string) {
        const category = this.all.filter(cat => cat.name === name)[0];
        if (!category) throw new InternalError(`invalid category: ${name}`);
        return category;
    }

}

