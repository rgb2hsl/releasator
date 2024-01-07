import {type Env} from "../env";

export function getDomainsData(env: Env) {
    let hoursOffset = env.DB_HOURS_OFFSET !== undefined ? parseInt(env.DB_HOURS_OFFSET) : 0;

    if (isNaN(hoursOffset)) {
        hoursOffset = 0;
        console.error(`getDomainsData: DB_HOURS_OFFSET is NaN!`);
    }

    if (hoursOffset !== 0) console.info(`getDomainsData: hoursOffsetIs is ${hoursOffset}`);

    return {hoursOffset}
}
