import {fromSQLiteDate, sqliteDate} from "releasator-types";
import {addHours, subHours} from "date-fns";
import {type UTCDate} from "@date-fns/utc";

export function offsetUTCDate(utcdate: UTCDate, hoursOffset: number) {
    if (hoursOffset === 0) return utcdate;
    return hoursOffset > 0 ? addHours(utcdate, hoursOffset) : subHours(utcdate, -hoursOffset);
}

export function offsetSQLiteDateString(date: string, hoursOffset: number, caller?: string): string {
    if (hoursOffset !== 0) {
        const utcdate = fromSQLiteDate(date, caller);
        return sqliteDate(offsetUTCDate(utcdate, hoursOffset), caller);
    } else {
        return typeof date === "string" ? date : sqliteDate(date);
    }
}
