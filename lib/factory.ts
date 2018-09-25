import { Database } from './database';
import { InternalError } from './util';
import { run, funnel } from 'f-promise';
import { config } from './config';

export type Dict<T> = { [name: string]: T };
export type StaticThis<T> = { new(): T };
export interface RowUpdate<T> {
    row: number;
    data: T;
}

export class Property {
    factory: Factory;
    name: string;
    columnName: string;
    columnIndex: number;
    type: string = 'string'; // by default
    parse: (str: string) => any;
    format: (val: any) => string;

    constructor(factory: Factory, name: string) {
        this.factory = factory;
        this.name = name;
    }

    convertIn(str: string) {
        if (this.parse) return this.parse(str);
        switch (this.type) {
            case 'string':
                return str || '';
            case 'number':
                return parseInt(str);
            default:
                throw new InternalError(`invalid type: ${this.type}`);
        }
    }
    convertOut(val: any) {
        if (this.format) return this.format(val);
        switch (this.type) {
            case 'string':
                return val;
            case 'number':
                return val.toString();
            default:
                throw new InternalError(`invalid type: ${this.type}`);
        }

    }

}

export class Factory {
    sheet: string;
    propertiesByName: Dict<Property> = {};
    propertiesByColumnName: Dict<Property> = {};
    propertiesByColumnIndex: Property[] = [];
    private funnel = funnel(1);
    private all: any[] | undefined;
    private static allFactories = [] as Factory[];

    constructor() {
        Factory.allFactories.push(this);
    }

    private parseHeaderRow(row: any[]) {
        for (var i = 0; i < row.length; i++) {
            const name = row[i] as string;
            const property = this.propertiesByColumnName[name];
            if (property) {
                property.columnIndex = i;
                this.propertiesByColumnIndex[i] = property;
            } else {
                console.warn(`${this.sheet}.${name}: extra column`);
            }
        }
        for (const name in this.propertiesByColumnName) {
            if (this.propertiesByColumnName[name].columnIndex == null) throw new InternalError(`${this.sheet}.${name}: column not found`);
        }
    }

    private rowIn<T>(row: any[]) {
        return this.propertiesByColumnIndex.reduce((r, prop, i) => {
            r[prop.name] = prop.convertIn(row[i]);
            return r;
        }, {} as Dict<any>) as T;
    }
    private rowOut<T>(data: T) {
        return this.propertiesByColumnIndex.map(p => p.convertOut((data as any)[p.name]));
    }

    invalidate() {
        this.funnel(() => {
            this.all = undefined;
        });
    }

    private load<T>(): T[] {
        if (this.all) return this.all;
        const rows = Database.readAll(this.sheet);
        if (rows.length < 1) throw new InternalError(`${this.sheet}: no column headers`);
        this.parseHeaderRow(rows[0]);
        return this.all = rows.slice(1).map(row => this.rowIn<T>(row));
    }

    readAll<T>(): T[] {
        return this.funnel(() => this.load());
    }
    append<T>(items: T[]) {
        return this.funnel(() => {
            const all = this.load();
            // TODO: write them to database
            let row = all.length + 2;
            Database.update(this.sheet, items.map(r => ({
                row: row++,
                data: this.rowOut(r),
            })));
            this.all = all.concat(items);
        });
    }

    update<T>(data: T[], where: (src: T, dst: T) => boolean, action: (src: T, dst: T) => void, orInsert?: boolean) {
        return this.funnel(() => {
            let all = this.load<T>();
            const modified = [];
            for (const src of data) {
                let row = 1;
                let found = false;
                for (let i = 0; i < all.length; i++) {
                    const dst = all[i];
                    if (where(src, dst)) {
                        action(src, dst);
                        modified.push({
                            row: i + 2, // header + 1 offset
                            data: dst,
                        });
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    if (orInsert) {
                        const dst = {} as T;
                        action(src, dst);
                        modified.push({
                            row: all.length + 2,
                            data: dst,
                        });
                        all.push(dst);
                    } else {
                        throw new InternalError(`update failed: key not found: ${JSON.stringify(src)}`);
                    }

                }
            }
            Database.update(this.sheet, modified.map(r => ({
                row: r.row,
                data: this.rowOut(r.data),
            })));
        });
    }
    static init() {
        if (Database.init()) {
            console.log(`cache will be refreshed every ${config.refreshMinutes} minute`);
            setInterval(() => {
                run(() => {
                    console.log('invalidating cache');
                    this.allFactories.forEach(f => f.invalidate());
                });
            }, config.refreshMinutes * 60 * 1000);
        }
    }
}

export class Record {
    static factory: Factory;
}

export function sheet(name: string) {
    return function (target: typeof Record) {
        target.factory.sheet = name;
    };
}

export function makeProperty(target: Record, name: string) {
    const t = target.constructor as typeof Record;
    if (!t.factory) t.factory = new Factory();
    let prop = t.factory.propertiesByName[name];
    if (!prop) {
        prop = t.factory.propertiesByName[name] = new Property(t.factory, name);
    }
    return prop;
}

export function column(columnName: string) {
    return function (target: Record, property: string) {
        const prop = makeProperty(target, property);
        prop.factory.propertiesByColumnName[columnName] = prop;
    };
}

export function type(type: string) {
    return function (target: Record, property: string) {
        makeProperty(target, property).type = type;
    };
}

export function parse(fn: (s: string) => any) {
    return function (target: Record, property: string) {
        makeProperty(target, property).parse = fn;
    };
}

export function format(fn: (v: any) => string) {
    return function (target: Record, property: string) {
        makeProperty(target, property).format = fn;
    };
}

export function ouiNon(target: Record, property: string) {
    makeProperty(target, property).parse = s => s === 'Oui';
    makeProperty(target, property).format = v => v ? 'Oui' : 'Non';
}

function invalid(name: string, v: string): string {
    throw new InternalError(`${name}: bad value: ${v}`);
}

export function strings(map: Dict<string>) {
    return function (target: Record, property: string) {
        makeProperty(target, property).parse = v => Object.keys(map).filter(k => map[k] === v)[0] || invalid(property, v);
        makeProperty(target, property).format = s => map[s] || invalid(property, s);
    };
}

