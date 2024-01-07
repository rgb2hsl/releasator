import {UTCDate} from "@date-fns/utc";
import {format} from "date-fns";

export function sqliteDate(date: UTCDate | Date, caller?: string) {
    try {
        return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
        console.error(`sqliteDate: Error parsing UTCDate to sqliteDate.${caller ? ' ' + caller : ''}`);
        throw e;
    }
}

export function fromSQLiteDate(sqliteDateString: string, caller?: string) {
    try {
        if (sqliteDateString.endsWith('Z') && sqliteDateString.includes("T")) {
            return new UTCDate(sqliteDateString);
        } else {
            return new UTCDate(`${sqliteDateString}Z`);
        }

    } catch (e) {
        console.error(`fromSQLiteDate: Error parsing ${sqliteDateString} to UTCDate.${caller ? ' ' + caller : ''}`);
        throw e;
    }
}
