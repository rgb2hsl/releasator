import z from "zod";
import {fromZodError} from "zod-validation-error";
import {type Env} from "../env";
import {v4 as uuidv4} from "uuid";
import {type RichRequest} from "../types/RichRequest";
import {
    type ReleaseObject,
    ReleaseObjectSchema,
    type ReleaseObjectStored,
    ReleaseObjectStoredSchema,
    type ReleaseObjectToInsert,
    sqliteDate
} from "releasator-types";
import {generateEditHash} from "../helpers/generateEditHash";
import {UTCDate} from "@date-fns/utc";
import {addMinutes} from "date-fns";
import {getDomainsData} from "../helpers/getDomainsData";
import {offsetSQLiteDateString, offsetUTCDate} from "../helpers/transformDateFromDB";

export async function insertReleaseObject(releaseObject: ReleaseObjectToInsert, env: Env, request: RichRequest): Promise<{
    success: true;
    data: ReleaseObject
} | {
    success: false;
    error: string;
}> {
    const {hoursOffset} = getDomainsData(env);

    const id = uuidv4();

    const nowWithOffset = offsetUTCDate(new UTCDate(), hoursOffset);

    const createdAt = sqliteDate(nowWithOffset);
    nowWithOffset.setMinutes(nowWithOffset.getMinutes() + request.serviceConfig.notificationDelayMinutes);
    const queuedTo = sqliteDate(addMinutes(nowWithOffset, 30));
    const editHash = await generateEditHash(releaseObject.repo, releaseObject.head.name);

    const releaseObjectToParse = {id, createdAt, queuedTo, postedAt: null, editHash, ...releaseObject};

    // validating

    const parseResult = ReleaseObjectSchema.safeParse(releaseObjectToParse);

    let releaseObjectParsed;

    if (parseResult.success) {
        releaseObjectParsed = parseResult.data;
    } else {
        const validationError = fromZodError(parseResult.error);
        const errorMessage = `Created release isn't valid for some reason ${validationError.message}`;
        console.error(`insertReleaseObject error: ${errorMessage}`);

        return {
            success: false,
            error: errorMessage
        };
    }

    // prepairing JSONS and inserting

    const refHeadRaw = JSON.stringify(releaseObjectParsed.head);
    const refBaseRaw = JSON.stringify(releaseObjectParsed.base);
    const releaseNotesRaw = JSON.stringify(releaseObjectParsed.releaseNotes);

    const {success} = await env.DB.prepare(`
        insert into releases (id, repo, refHeadRaw, refBaseRaw, createdAt, queuedTo, postedAt, releaseNotesRaw,
                              editHash)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(releaseObjectParsed.id, releaseObjectParsed.repo, refHeadRaw, refBaseRaw, releaseObjectParsed.createdAt, releaseObjectParsed.queuedTo, null, releaseNotesRaw, releaseObjectParsed.editHash).run();

    if (success) {
        return {
            success: true,
            data: releaseObjectParsed
        };
    } else {
        return {
            success: false,
            error: "insering into DB error"
        };
    }

}

export async function getQueuedReleaseObjects(env: Env): Promise<{
    success: true;
    data: Array<ReleaseObject | null>
} | {
    success: false;
    error: string;
}> {
    const {hoursOffset} = getDomainsData(env);

    const {success, results} = await env.DB.prepare(`
        select *
        from releases r
        where r.postedAt IS NULL
        and r.queuedTo < datetime('now', 'utc')
    `).run<ReleaseObjectStored>();

    if (success) {

        if (results.length === 0) {
            return {
                success: true,
                data: []
            }
        }

        const storedResults = z.array(ReleaseObjectStoredSchema).safeParse(results);

        if (storedResults.success) {
            // got stored object, transform to not stored

            let errorsCnt = 0;
            const results = storedResults.data.map((sr, i) => {
                const r = ReleaseObjectSchema.safeParse({
                    id: sr.id,
                    repo: sr.repo,
                    head: JSON.parse(sr.refHeadRaw),
                    base: JSON.parse(sr.refBaseRaw),
                    createdAt: offsetSQLiteDateString(sr.createdAt, -hoursOffset, `getQueuedReleaseObjects ${sr.id} createdAt`),
                    queuedTo: offsetSQLiteDateString(sr.queuedTo, -hoursOffset, `getQueuedReleaseObjects ${sr.id} queuedTo`),
                    postedAt: sr.postedAt === null ? null : offsetSQLiteDateString(sr.postedAt, -hoursOffset, `getQueuedReleaseObjects ${sr.id} queuedTo`),
                    releaseNotes: JSON.parse(sr.releaseNotesRaw),
                    editHash: sr.editHash

                });

                if (r.success) {
                    return r.data;
                } else {
                    errorsCnt++;
                    const error = `getQueuedReleaseObjects: failed of transform from ReleaseObjectStored into ReleaseObject of ${storedResults.data[i]?.id}`;
                    console.error(error);
                    return null;
                }
            });

            if (errorsCnt === 0 || errorsCnt < storedResults.data.length) {
                return {
                    success: true,
                    data: results
                }
            } else {
                return {
                    success: false,
                    error: 'getQueuedReleaseObjects: all batches failed'
                }
            }

        } else {
            const error = `getQueuedReleaseObjects: results aren't valid ReleaseObjectStored`;
            console.error(error);
            return {
                success: false,
                error
            };
        }
    } else {
        const error = `getQueuedReleaseObjects: failed to make request`;
        console.error(error);
        return {
            success: false,
            error
        };
    }
}


export async function getReleaseObjectById(id: string, env: Env): Promise<{
    success: true;
    data: ReleaseObject
} | {
    success: false;
    error: string;
}> {
    const {success, results} = await env.DB.prepare(`
        select *
        from releases r
        where r.id = ?
    `).bind(id).run<ReleaseObjectStored>();
    console.info(`getReleaseObjectById called with id ${id}`);
    const {hoursOffset} = getDomainsData(env);

    if (success && results.length) {
        const result = ReleaseObjectStoredSchema.safeParse(results[0]);

        if (result.success) {
            // got stored object, transform to not stored
            console.info(`getReleaseObjectById: ${id}: select query successful`);

            const releaseObjectResult = ReleaseObjectSchema.safeParse({
                id: result.data.id,
                repo: result.data.repo,
                head: JSON.parse(result.data.refHeadRaw),
                base: JSON.parse(result.data.refBaseRaw),
                createdAt: offsetSQLiteDateString(result.data.createdAt, -hoursOffset, `getReleaseObjectById: ${id} createdAt`),
                queuedTo: offsetSQLiteDateString(result.data.queuedTo, -hoursOffset, `getReleaseObjectById: ${id} queuedTo`),
                postedAt: result.data.postedAt === null ? null : offsetSQLiteDateString(result.data.postedAt, -hoursOffset, `getReleaseObjectById: ${id} postedAt`),
                releaseNotes: JSON.parse(result.data.releaseNotesRaw),
                editHash: result.data.editHash

            });

            if (releaseObjectResult.success) {
                console.info(`getReleaseObjectById: ${id}: transform to ReleaseObject successfull`);
                return releaseObjectResult;
            } else {
                const error = `getReleaseObjectById: failed of ${id} transform from ReleaseObjectStored into ReleaseObject`;
                console.error(error);
                return {
                    success: false,
                    error
                };
            }

        } else {
            const error = `getReleaseObjectById: result of ${id} isn't valid ReleaseObjectStored`;
            console.error(error);
            return {
                success: false,
                error
            };
        }
    } else {
        const error = `getReleaseObjectById: failed to find with id ${id}`;
        console.error(error);
        return {
            success: false,
            error
        };
    }
}

export async function updateReleaseObjectPostedAt(id: string, postedAt: string, env: Env): Promise<{
    success: true;
} | {
    success: false;
    error: string;
}> {
    const {hoursOffset} = getDomainsData(env);

    const result = await env.DB.prepare(`
        update releases
        set postedAt = ?
        where releases.id = ?
        returning *
    `).bind(
        offsetSQLiteDateString(postedAt, hoursOffset, `updateReleaseObjectPostedAt: ${id} postedAt`),
        id,
    ).run();

    if (result.success) {
        return {
            success: true,
        };
    } else {
        return {
            success: false,
            error: "updateReleaseObjectPostedAt: updating DB error"
        };
    }

}


export async function updateReleaseObject(releaseObject: ReleaseObject, env: Env): Promise<{
    success: true;
    data: ReleaseObject
} | {
    success: false;
    error: string;
}> {
    const {hoursOffset} = getDomainsData(env);

    const parseResult = ReleaseObjectSchema.safeParse(releaseObject);

    let releaseObjectParsed;

    if (parseResult.success) {
        releaseObjectParsed = parseResult.data;
    } else {
        const validationError = fromZodError(parseResult.error);
        const errorMessage = `Created release isn't valid for some reason ${validationError.message}`;
        console.error(`insertReleaseObject error: ${errorMessage}`);

        return {
            success: false,
            error: errorMessage
        };
    }

    // prepairing JSONS and inserting

    const refHeadRaw = JSON.stringify(releaseObjectParsed.head);
    const refBaseRaw = JSON.stringify(releaseObjectParsed.base);
    const releaseNotesRaw = JSON.stringify(releaseObjectParsed.releaseNotes);

    const {success} = await env.DB.prepare(`
        update releases
        set repo            = ?,
            refHeadRaw      = ?,
            refBaseRaw      = ?,
            createdAt       = ?,
            queuedTo        = ?,
            postedAt        = ?,
            releaseNotesRaw = ?,
            editHash        = ?
        where releases.id = ?
        returning *
    `).bind(
        releaseObjectParsed.repo,
        refHeadRaw,
        refBaseRaw,
        offsetSQLiteDateString(releaseObjectParsed.createdAt, hoursOffset, `updateReleaseObject: ${releaseObjectParsed.id} createdAt`),
        offsetSQLiteDateString(releaseObjectParsed.queuedTo, hoursOffset, `updateReleaseObject: ${releaseObjectParsed.id} queuedTo`),
        releaseObjectParsed.postedAt === null ? null : offsetSQLiteDateString(releaseObjectParsed.postedAt, hoursOffset, `updateReleaseObject: ${releaseObjectParsed.id} postedAt`),
        releaseNotesRaw,
        releaseObjectParsed.editHash,
        releaseObjectParsed.id,
    ).run();

    if (success) {
        return {
            success: true,
            data: releaseObjectParsed
        };
    } else {
        return {
            success: false,
            error: "updateReleaseObject: updating DB error"
        };
    }

}

