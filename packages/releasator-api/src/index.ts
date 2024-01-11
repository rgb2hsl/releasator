/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import {GetQueuedReleases, GetReleaseByIdForEdit, PostRelease, PutReleaseByIdFromEdit} from "./routes/releases";
import {OpenAPIRouter} from "@cloudflare/itty-router-openapi";
import {withAuth} from "./middlewares/withAuth";
import {type Env} from "./env";
import {type RichRequest} from "./types/RichRequest";
import {createConfig, withConfig} from "./middlewares/withConfig";
import {generateEditHash} from "./helpers/generateEditHash";
import {withParams} from "itty-router";
import {createSlackPayload, sendSlackNotification} from "./services/slack";
import {offsetUTCDate} from "./helpers/transformDateFromDB";
import {UTCDate} from "@date-fns/utc";
import {getDomainsData} from "./helpers/getDomainsData";
import {sqliteDate} from "releasator-types";
import {getQueuedReleaseObjects, updateReleaseObjectPostedAt} from "./domains/ReleaseObjectsDomain";
import {createCors} from "./helpers/createCors";


// Create a new router
const router = OpenAPIRouter();

const {preflight, corsify} = createCors({
    methods: ["GET", "PUT", "POST"]
});

router.all("*", withConfig, preflight);

router.post("/api/releases", withAuth, PostRelease);

router.put("/api/releases/:id/:token", withParams, PutReleaseByIdFromEdit);

router.get("/api/releases/:id/:token", withParams, GetReleaseByIdForEdit);

router.get("/api/releases/queued", withAuth, GetQueuedReleases);

router.get(`/api/test`, async (request: RichRequest, env: Env) => {
    return new Response(await generateEditHash("kek", "pek"), {status: 200});
});

router.get(`/api/test/slack-blocks`, async (request: RichRequest) => {
    return new Response(JSON.stringify(createSlackPayload(await request.json(), request.serviceConfig)), {status: 200});
});

// 404 for everything else
router.all("*", () => new Response("Not Found.", {status: 404}));


export default {
    fetch: async (...args: any[]) => await router
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    .handle(...args) // TODO!!!!!

    // add CORS headers to all requests,
    // including errors
    .then(corsify)
    ,

    // The scheduled handler is invoked at the interval set in our wrangler.toml's
    // [[triggers]] configuration.
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {

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
                const results = await sendSlackNotification(release, config, true);

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
};
