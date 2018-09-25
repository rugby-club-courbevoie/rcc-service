import { Dict, column, sheet, Record, parse, type, ouiNon, strings } from '../factory';
import { InternalError } from '../util';
import { Licensee } from './licensee';
import { Category } from './category';

export interface PresenceFilter {
    date: string;
    event: string;
    category: string;
    coachLicense?: string;
}

function presenceFilter(f: PresenceFilter) {
    return (p: Presence) =>
        (!f.date || f.date === p.date) &&
        (!f.event || f.event === p.event) &&
        (!f.category || f.category == p.category);
}

function matchYears(category: Category, dob: string) {
    const year = parseInt(dob.substring(6));
    return year === category.year1 || year === category.year2;
}

function fullName(licensee: Licensee) {
    return licensee.firstName + ' ' + licensee.lastName;
}

const eventStrings = {
    training: 'entrainement',
    game: 'match',
} as Dict<string>

@sheet('Présences')
export class Presence extends Record {
    @column('Evénement')
    @strings(eventStrings)
    event: string;

    @column('Catégorie')
    category: string;

    @column('Date')
    date: string;

    @column('Licence joueur')
    playerLicense: string;

    @column('Nom joueur')
    playerName: string;

    @column('Présent')
    @ouiNon
    present: boolean;

    @column('Horo présence')
    presentStamp?: string;

    @column('Licence éducateur')
    coachLicense: string;

    @column('Nom éducateur')
    coachName: string;

    @column('Excusé')
    @ouiNon
    excused: boolean;

    @column('Excusé par')
    excusedBy: string;

    @column('Motif')
    excusedReason: string;

    @column('Horo excusé')
    excusedStamp?: string;

    static fillTraining(filter: PresenceFilter) {
        if (!filter.coachLicense) throw new InternalError(`missing coachLicense parameter`);
        // TODO: check that training day is valid
        const category = Category.find(filter.category);
        const players = Licensee.all.filter(player =>
            player.active &&
            matchYears(category, player.dob));
        const presences = players.map(player => Presence.fromPlayer(player, filter));
        //this.factory.append(presences);
        return presences;
    }
    static fillGame(filter: PresenceFilter): Presence[] {
        throw new InternalError('NIY');
    }
    static read(filter: PresenceFilter) {
        return this.factory.readAll<Presence>().filter(presenceFilter(filter));
    }
    static generate(filter: PresenceFilter) {
        switch (filter.event) {
            case 'training':
                return this.fillTraining(filter);
            case 'game':
                return this.fillGame(filter);
            default:
                throw new InternalError(`bad event: ${filter.event}`);
        }
    }

    static updatePresence(data: Presence[]) {
        if (!data.length) return;
        let presences = this.read(data[0]);
        if (presences.length === 0) {
            // first update - generate alle entires
            this.factory.append(this.generate(data[0]));
        }
        // update entries from data
        this.factory.update(data,
            (src, dst) =>
                dst.playerLicense === src.playerLicense &&
                dst.date === src.date,
            (src, dst) => {
                dst.present = src.present;
                dst.presentStamp = src.presentStamp;
            }, true);
    }

    private static fromPlayer(player: Licensee, filter: PresenceFilter) {
        const coach = Licensee.find(filter.coachLicense!);
        if (!coach.isCoach) throw new InternalError(`licensee ${filter.coachLicense} is not a coach`);
        const presence: Presence = {
            event: filter.event,
            category: filter.category,
            date: filter.date,
            playerLicense: player.license,
            playerName: fullName(player),
            // we set the present flag by default but presentStamp is only set if coach does something
            present: true,
            presentStamp: '',
            coachLicense: coach.license,
            coachName: fullName(coach),
            excused: false,
            excusedBy: '',
            excusedStamp: '',
            excusedReason: ''
        }
        return presence;
    }
}
