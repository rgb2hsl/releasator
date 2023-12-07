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
import { PostRelease } from './routes/releases';
import { OpenAPIRouter } from '@cloudflare/itty-router-openapi';
import { withAuth } from './middlewares/withAuth';
import { type Env } from './env';
import { getTagsList } from './services/github';
import { type RichRequest } from './types/RichRequest';
import { withConfig } from './middlewares/withConfig';


// Create a new router
const router = OpenAPIRouter()

router.all('*', withAuth, withConfig)

router.post('/api/releases', PostRelease)

router.get(`/api/test`, async (request: RichRequest,  env: Env) => {
    const d = await getTagsList('rgb2hsl/test-ch-releases-messages', env);

    d?.forEach(tag => { console.log(`there is a tag with name ${tag.name}`); })

    return new Response('Hi', { status: 200 });
})

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }))

export default {
    fetch: router.handle,

    // The scheduled handler is invoked at the interval set in our wrangler.toml's
    // [[triggers]] configuration.
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        console.log(`cron invoked at ${event.cron}`);

        // URL to which the request is sent
        // TODO secret and config
        const url = 'https://hooks.slack.com/services/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';

        // Data to be sent in the request body
        const data = {
            text: `Test message with emoji's 🐞, invoked at ${event.cron}`
        };

        // Create a request with fetch
        await fetch(url, {
            method: 'POST', // Specify the method
            headers: {
                'Content-Type': 'application/json' // Set the content type
            },
            body: JSON.stringify(data) // Convert the JavaScript object to a JSON string
        })
            .then(data => {
                console.log(`message successfully delivered at ${event.cron}`, data);
            }, error => {
                console.error(`error at ${event.cron}`, error);
            })
    }
};
