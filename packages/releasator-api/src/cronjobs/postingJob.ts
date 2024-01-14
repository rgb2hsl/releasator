import type {Env} from "../env";
import {getDomainsData} from "../helpers/getDomainsData";
import {offsetUTCDate} from "../helpers/transformDateFromDB";
import {UTCDate} from "@date-fns/utc";
import {sqliteDate} from "releasator-types";
import {createConfig} from "../middlewares/withConfig";
import {getQueuedReleaseObjects, updateReleaseObjectPostedAt} from "../domains/ReleaseObjectsDomain";
import {sendSlackReleaseNotification} from "../services/slack";

export async function postingJob(env: Env) {
    const {hoursOffset} = getDomainsData(env);
    const nowWithOffset = offsetUTCDate(new UTCDate(), hoursOffset);

    console.log(`cron invoked at ${sqliteDate(nowWithOffset, "cronjob")}`);

    const configResult = createConfig(env);

    if (!configResult.success || !configResult.data) {
        console.error('error at cronjob while creating config');
        return;
    }

    const config = configResult.data;

    // get releases needs to be posted
    const releasesToPostResult = await getQueuedReleaseObjects(env);

    if (!releasesToPostResult.success) {
        console.error("error at cronjob while getQueuedReleaseObjects: ", releasesToPostResult.error);
        return;
    }

    if (releasesToPostResult.data.length === 0) {
        console.info("getQueuedReleaseObjects: no releases queued");
        return;
    }


    for (const release of releasesToPostResult.data) {
        if (release) {
            const results = await sendSlackReleaseNotification(release, config, true);

            if (results.successfull?.length !== 0) {
                // TODO we considering successfull sent even if something was failed
                const result = await updateReleaseObjectPostedAt(release.id, sqliteDate(new UTCDate()), env);

                if (!result.success) {
                    console.error(`error at cronjob while trying to set postedAt for release ${release.id}: ${result.error}`);
                }
            }
        } else {
            console.error(`getQueuedReleaseObjects: [${releasesToPostResult.data.indexOf(release)}] element of releasesToPostResult.data is null`);
        }
    }
}
