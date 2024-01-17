import { APIConfigSchema } from "releasator-types";
import { promisify } from "util";
import { exec } from "child_process";
import { existsSync, promises } from "fs";
import chalk from 'chalk';

/*
    CONFIGURATION
    Change variables below to suit your setup
    --------------------------------------------------------------------------------------------------------------------
 */

// NEED TO BE CHANGED

const PROJECT_PREFIX = "my"; // change to your company or project shortname
const CF_PROFILE = "my-cf-username"; // first part pf your email, used in CF

const API_CONFIG_DRAFT = {
    allowedDemoDomains: ['google.com'], // allowed domains for demo
    knownContributors: [{ "githubLogin": "rgb2hsl", "slackUID": "U0000000000" }], // for Slack mentions
    knownProducts: [{ 'repoString': 'rgb2hsl/releasator', 'name': 'Releasator' }], // for product names in release notes
    notificationServices: ['slack'], // currently only slack avaiable
    notificationDelayMinutes: 15, // time from release notes creation to posting in into channel
};

// can be left as is

const CF_API_PROJECT_NAME = `releasator-api-${PROJECT_PREFIX.toLowerCase().trim()}`; // for your CF dashboard
const CF_GUI_PROJECT_NAME = `releasator-gui-${PROJECT_PREFIX.toLowerCase().trim()}`; // for your CF dashboard
const API_DB_NAME = `RE-${PROJECT_PREFIX.toUpperCase().trim()}-DB`

const FLOW_USE_EXISTING_PAGES_PROJECT = true; // default is false
const FLOW_USE_EXISTING_DATABASE = true; // default is false

const FORK_MODE = true;

/*
    --------------------------------------------------------------------------------------------------------------------
    End of CONFIGURATION
 */

const execAsync = promisify(exec);

function stepNumber(step) {
    const stepstr = (`${step}`)
        .replace(/0/g,'0️⃣')
        .replace(/1/g,'1️⃣')
        .replace(/2/g,'2️⃣')
        .replace(/3/g,'3️⃣')
        .replace(/4/g,'4️⃣')
        .replace(/5/g,'5️⃣')
        .replace(/6/g,'6️⃣')
        .replace(/7/g,'7️⃣')
        .replace(/8/g,'8️⃣')
        .replace(/9/g,'9️⃣');

    return stepstr;
}

let stepCounter = 0;

function stepOut(name) {
    console.info(`${stepNumber(++stepCounter)}: ${chalk.black.underline.bgWhite(name)}`);
}

function infoOut(info) {
    console.info(`🔸: ${chalk.dim(info)}`);
}

function warnOut(warn) {
    console.info(`🟡: ${warn}`);
}

function successOut(success) {
    console.info(`🟢: ${success}`);
}

function errorOut(error) {
    console.info(`🔴: ${error}`);
}

function errorOutAndExit(text, stderr, code) {
    errorOut(text);
    console.error(stderr);
    process.exit(code);
}

async function replaceLines(path, replaces) {
    let content = await promises.readFile(path, 'utf8');
    const lines = content.split('\n');

    content = lines.map(line => {
        const match = replaces.map(r => r[0]).find(search => line.startsWith(search));
        if (match) {
            const replace = replaces.find(r => r[0] === match);
            return replace?.[1] ?? line;
        } else {
            return line;
        }
    }).join('\n');

    await promises.writeFile(path, content, 'utf8');
}

async function main() {

    // check that wrangler is logged in
    stepOut('Checking wrangler login...');

    try {
        infoOut('Executing "wrangler whoami"...');
        const { stdout, stderr } = await execAsync('wrangler whoami');
        if (stderr) errorOutAndExit(`"wrangler whoami" returned error:`, stderr, 10);
        if (stdout.toLowerCase().trim().includes('not authenticated'))
            errorOutAndExit(`You are logged out in wrangler cli, you need to run 'wrangler login' and follow up the instructions.`,'',11);
    } catch (e) {
        errorOutAndExit(`"wrangler whoami" failed to run:`,e,12);
    }

    successOut('Wrangler logged in!')


    /*
         ============ GUI ===================================
     */

    stepOut('Setting up GUI...');

    /*
         Create CF Pages project exit code 20+
     */

    let cfPagesProjectExists = false;
    let cfDeployedGuiRoot;

    if (FLOW_USE_EXISTING_PAGES_PROJECT) {
        infoOut('Checking if CF Pages project exists...');

        try {
            const { stdout, stderr } = await execAsync(`wrangler pages project list`);
            if (stderr) errorOutAndExit(`Checking if CF Pages project exists returned error:`,stderr,24);

            // search project name with spaces on each side (stdout is a table)
            const tokens = stdout.match(/[a-zA-Z0-9-_.]+/g);

            const projectToken = tokens.find(token => token === CF_GUI_PROJECT_NAME);

            if (projectToken) {
                successOut(`CF Pages project ${CF_GUI_PROJECT_NAME} exists`);
                cfPagesProjectExists = true;
            } else infoOut('CF Pages project not exists');

        } catch (e) {
            errorOutAndExit('Error occurred duting checking if CF Pages project exists', e, 25)
        }
    }

    if (!FLOW_USE_EXISTING_PAGES_PROJECT || !cfPagesProjectExists) {
        infoOut('Creating CF Pages project...');

        try {
            const { stdout, stderr } = await execAsync(`GUI_PROJECT_NAME=${CF_GUI_PROJECT_NAME} npm run setup -w packages/releasator-gui`);

            if (stderr) errorOutAndExit(`Creating pages project returned error:`,stderr,20);

            const cleanStdout = stdout.toLowerCase().trim();

            if (!cleanStdout.includes(`successfully created the '${CF_GUI_PROJECT_NAME}' project`))
                errorOutAndExit(`CF Pages project creation failed:`,stdout,22);

            // seems created, lets find pages URL
            const urls = cleanStdout.match(/https:\/\/[a-zA-Z0-9-_.]+/g);

            if (urls === null || urls.length !== 1)
                errorOutAndExit(`CF Pages project seemed created but no pages url were found:`, stdout, 21);

            successOut(`Pages project '${CF_GUI_PROJECT_NAME}' successfully created`);
            cfDeployedGuiRoot = urls.pop();

        } catch (e) {
            errorOutAndExit(`Error occurred during creating CF Project. Check if project with that name already`
                + `exists, you've used correct project and main branch names. Check the output:`, e, 23);
        }
    }

    /*
         Create .env to prepare GUI for build and deploy, exit code 30+
     */

    infoOut('Creating ".env" config for GUI...');
    const envFilePath = "packages/releasator-gui/.env";

    const CfPredictedApiRoot = `https://${CF_API_PROJECT_NAME}.${CF_PROFILE}.workers.dev`;
    let guiEnvIscreated = false;

    try {
        const { stderr } = await execAsync(`npm run cfg -w packages/releasator-gui`);
        if (stderr) errorOutAndExit(`Creating ".env" config for GUI returned error:`, stderr, 30)
        else {
            guiEnvIscreated = existsSync(envFilePath);
        }
    } catch (e) {
        const msg = (String(e)).includes('env_not_exists')
            ? `.env file for GUI not exists:`
            : `Error occurred during creating CF Project:`;
        errorOutAndExit(msg, e, 31);
    }

    // check if .env created
    if (!guiEnvIscreated) errorOutAndExit(`.env file for GUI not exists`, '', 33);

    successOut(`GUI's ".env" file created!`);

    const setUpGuiSettings = async (apiRoot) => {
        infoOut(`Setting up GUI's ".env" settings (API_ROOT=${apiRoot})...`);

        try {
            await replaceLines(envFilePath, [
                ['API_ROOT=',`API_ROOT=${apiRoot}`]
            ])
            successOut(`GUI's ".env" settings set up!`);
        } catch (e) {
            errorOutAndExit(`Error occurred during setting GUI's .env file with values:`, e, 32);
        }
    }

    await setUpGuiSettings(CfPredictedApiRoot);



    /*
         Build and deploy, exit codes 40+
     */

    const deployGUI = async () => {
        infoOut('Building and deploying GUI...');

        try {
            const { stdout, stderr } = await execAsync(`GUI_PROJECT_NAME=${CF_GUI_PROJECT_NAME} npm run deploy -w packages/releasator-gui`);

            if (stderr) errorOutAndExit(`Building and deploying GUI returned error:`, stderr, 40);

            const cleanStdout = stdout.toLowerCase().trim();

            if (!cleanStdout.includes('compiled successfully in'))
                errorOutAndExit(`Building GUI failed:`, stdout, 41);

            if (!cleanStdout.includes('deployment complete! take a peek over at'))
                errorOutAndExit(`Deploying GUI to CF pages failed:`, stdout, 42);

            if (!cfDeployedGuiRoot) {
                // we still need to get guiRoot
                infoOut('Obtaining GUI root...');

                const urls = cleanStdout.match(/https:\/\/[a-zA-Z0-9-_.]+/g);
                if (urls.length !== 1) errorOutAndExit(`Unable to obtain GUI url from output (cant find single url):`, stdout, 47);
                const url = urls[0];
                const urlTokens = url.slice(8).match(/[a-zA-Z0-9-_]+/g);
                if (urlTokens.length <= 2) errorOutAndExit(`Unable to obtain GUI url from output (url seems bad):`, stdout, 48);
                cfDeployedGuiRoot = url.replace(`${urlTokens[0]}.`,'');
            }

            successOut(`GUI set up, built and deployed to ${cfDeployedGuiRoot}. It should be available in a minutes.`)

        } catch (e) {
            errorOutAndExit(`Error occurred during GUI deploy and build:`, e, 43);
        }
    }

    await deployGUI()

    /*
     ============ DB ===================================
    */

    stepOut('Setting up R1 database...');
    let apiDBBindings = [];
    let d1DatabaseExists = false;

    // TODO нужно проверять существоаание и получать байндинги через wrangler d1 info NAME
    // ищется регуляркой [a-z0-9-]{30,99}

    if (FLOW_USE_EXISTING_DATABASE) {
        infoOut(`Checking if R1 database ${API_DB_NAME} exists...`);

        try {
            const { stdout, stderr } = await execAsync(`wrangler d1 info ${API_DB_NAME}`);
            if (stderr) errorOutAndExit(`Checking if R1 database ${API_DB_NAME} exists returned error:`,stderr,53);

            const dbIds = stdout.match(/[a-z0-9-]{30,99}/g);

            if (dbIds.length !== 1) infoOut(`R1 database ${API_DB_NAME} not exists`);
            else {
                d1DatabaseExists = true;
                successOut(`R1 database ${API_DB_NAME} exists with ID ${dbIds[0]}`);
                // try to find binding
                apiDBBindings = [
                    'binding = "DB"',
                    `database_name = "${API_DB_NAME}"`,
                    `database_id = "${dbIds[0]}"`
                ]
            }
        } catch (e) {
            errorOutAndExit(`Error occurred during checking if R1 database ${API_DB_NAME} exists`, e, 54)
        }
    }

    /*
      DB creation, exit codes 50+
    */

    if (!FLOW_USE_EXISTING_DATABASE || !d1DatabaseExists) {
        infoOut(`Creating DB ${API_DB_NAME}...`);

        try {
            const { stdout, stderr } = await execAsync(`DB=${API_DB_NAME} npm run db:create -w packages/releasator-api`);

            if (stderr) errorOutAndExit(`Creating DB ${API_DB_NAME} returned error:`, stderr, 50);

            // try to find DB binding in output
            const lines = stdout.split('\n');

            apiDBBindings = lines.filter(line =>
                line.startsWith('binding =')
                || line.startsWith('database_name =')
                || line.startsWith('database_id =')
            );

            if (apiDBBindings.length !== 3)
                errorOutAndExit(`Creating DB ${API_DB_NAME} failed, can't find DB bindings in the output:`, stdout, 51);

            infoOut('DB bindings:');
            for (const b of apiDBBindings)
                infoOut(b);

            successOut(`DB ${API_DB_NAME} created, bindings stored.`)

        } catch (e) {
            errorOutAndExit(`Error occurred during DB DB ${API_DB_NAME} creation:`, e, 52);
        }

        /*
          DB schema deploying, exit codes 60+
        */

        infoOut(`Creating tables in DB ${API_DB_NAME}...`);

        try {
            const { stdout, stderr } = await execAsync(`DB=${API_DB_NAME} npm run db:schema -w packages/releasator-api`);

            if (stderr) errorOutAndExit(`Creating tables in DB ${API_DB_NAME} returned error:`, stderr, 60);

            if (!stdout.toLowerCase().includes('executed') || !stdout.toLowerCase().includes('commands in'))
                errorOutAndExit(`Creating tables in DB ${API_DB_NAME} failed:`, stdout, 61);

            successOut(`Tables in DB ${API_DB_NAME} created!`)

        } catch (e) {
            errorOutAndExit(`Error occurred during creating tables in DB ${API_DB_NAME}:`, e, 62);
        }
    }

    /*
     ============ API ===================================
    */

    stepOut('Setting up API worker...');

    /*
        Configuring wrangler for API, exit codes 70+
    */

    infoOut(`Creating "wrangler.toml" configuration for API...`);

    const wranglerTomlFilePath = "packages/releasator-api/wrangler.toml";
    let wranglerTomlIscreated = false;

    try {
        const { stderr } = await execAsync(`npm run cfg -w packages/releasator-api`);
        if (stderr) errorOutAndExit(`Creating "wrangler.toml" configuration for API returned error:`, stderr, 70)
        else {
            wranglerTomlIscreated = existsSync(wranglerTomlFilePath);
        }
    } catch (e) {
        errorOutAndExit('Error occurred during creating "wrangler.toml" configuration for API', e, 71);
    }

    // check if wrangler.toml created
    if (!wranglerTomlIscreated) errorOutAndExit(`"wrangler.toml" file for API not exists`, '', 72);

    successOut(`"wrangler.toml" configuration for API created!`);

    infoOut(`Setting up API's "wrangler.toml" settings...`);

    const apiConfigRaw = {
        guiRoot: cfDeployedGuiRoot,
        ...API_CONFIG_DRAFT
    };
    const result = APIConfigSchema.safeParse(apiConfigRaw);
    if (!result.success) errorOutAndExit(`"wrangler.toml" SERVICE_CONFIG error`, result.error, 73);
    const apiConfig = result.data;

    infoOut(`Using previously deployed GUI url (${cfDeployedGuiRoot}) as "guiRoot"...`);

    try {
        await replaceLines(wranglerTomlFilePath, [
            ['name =',`name = "${CF_API_PROJECT_NAME}"`],

            ['binding =', apiDBBindings.find(line => line.startsWith('binding ='))],
            ['database_name =', apiDBBindings.find(line => line.startsWith('database_name ='))],
            ['database_id =', apiDBBindings.find(line => line.startsWith('database_id ='))],

            ['SERVICE_CONFIG =', `SERVICE_CONFIG = '${JSON.stringify(apiConfig)}'`],

            ...(FORK_MODE ? [
                ['AUTH_SUPER_TOKEN =', ''],
                ['GITHUB_TOKEN =', ''],
                ['SLACK_ADMIN_CHANNEL_WEBHOOK =', ''],
                ['SLACK_NOTIFICATIONS_CHANNEL_WEBHOOK =', ''],
            ] : [])
        ])

        warnOut(`Due to FORK_MODE is on, secrets removed from wrangler.toml`);

        successOut(`API's "wrangler.toml" settings set up!`);
    } catch (e) {
        errorOutAndExit(`Error occurred during setting API's "wrangler.toml" file with values:`, e, 74);
    }

    /*
        Deploying API, exit codes 80+
    */

    infoOut(`Deploying API...`);
    let deployedAPIroot;

    try {
        const { stdout, stderr } = await execAsync(`npm run deploy -w packages/releasator-api`);

        if (stderr) errorOutAndExit(`Deploying API returned error:`, stderr, 80);

        if (!stdout.toLowerCase().includes('current deployment id') || !stdout.toLowerCase().includes('published'))
            errorOutAndExit(`Deploying API failed:`, stdout, 81);

        // trying to find deployment url
        const lines = stdout.split('\n');
        const url = lines.find(line => line.trim().toLowerCase().startsWith(`https://`));

        if (!url) errorOutAndExit(`API deployed, but setup failed to find deployed API url`, stdout, 82);

        deployedAPIroot = url.trim();

        successOut(`API deployed to ${deployedAPIroot}!`);

    } catch (e) {
        errorOutAndExit(`Error occurred during deploying API:`, e, 83);
    }

    /*
        Checking if CF pages needs redeployment...
    */

    infoOut(`One more thing! Checking if GUI's API root is the same as deployed API url...`);

    if (deployedAPIroot === CfPredictedApiRoot) {
        successOut(`Good news, API root for GUI set correctly!`);
    } else {
        warnOut(`Whoops. GUI needs to be redeployed. Don't worry! It's just for one.`);
        await setUpGuiSettings(deployedAPIroot);
        await deployGUI();
    }

    /*
     ============ PREPARATIONS ===================================
     exit codes: 100+
    */

    if (FORK_MODE) {
        stepOut('Preparations for commit (FORK_MODE is "true")...');

        /*
            Alter .gitignore...
        */

        infoOut(`Excluding wrangler.toml and .env from .gitignore...`);

        try {
            await replaceLines('.gitignore', [
                ['wrangler.toml', ''],
                ['.env', '']
            ])
        } catch (e) {
            errorOutAndExit(`Error occurred during excluding wrangler.toml and .env from .gitignore...`, e, 100);
        }

        successOut(`.gitignore is now ok to be committed!`);

        /*
            Prepairing deploy action...
        */

        infoOut(`Prapairaing deploy GitHub Action for this repo...`);

        try {
            await replaceLines('packages/releasator-gh-workflow/releasator-deploy.yaml', [
                [
                    '          command: pages deploy',
                    `          command: pages deploy ./dist --project-name=${CF_GUI_PROJECT_NAME}`
                ]
            ])
        } catch (e) {
            errorOutAndExit(`Error occurred during replaceLines of GitHub Action for this repo`, e, 101);
        }

        // copy

        try {
            const { stderr } = await execAsync(`mkdir -p .github/workflows && cp packages/releasator-gh-workflow/releasator-deploy.yaml .github/workflows/`);
            if (stderr) errorOutAndExit(`Error occurred during cp GitHub Action to workflows`, e, 102);
        } catch (e) {
            errorOutAndExit(`Error catched during cp GitHub Action to workflows`, e, 103);
        }

        successOut(`GitHub Action for deploy is ready`);

        console.log(`\n`
            + chalk.bold(`All set now!\n`)
            + `Now go to the repo settings in GH and set following secrets:\n`
            + `  CLOUDFLARE_API_TOKEN - your token for accessing CF from CI\n`
            + `  CLOUDFLARE_ACCOUNT_ID - your CF account id\n`
            + `  AUTH_SUPER_TOKEN - token you'll be using in ${chalk.bold('tracked repos')} to push release notes\n`
            + `  RELEASATOR_GITHUB_TOKEN - create a fine grained token with read access to contents, meta and pr's of ${chalk.bold('tracked repos')}\n`
            + `  SLACK_ADMIN_CHANNEL_WEBHOOK - create a posting webhook for "admin" chat in slack (release notes edit links will appear there)\n`
            + `  SLACK_NOTIFICATIONS_CHANNEL_WEBHOOK - same, but for posting actual release notes\n`
            + `  \n`
            + `  Create those Slack channels, if you haven't yet.\n`
            + `  \n`
            + `  After that, commit all the changes of this repo to origin and trigger a first fully functional deploy.\n`
            + `  From now on, use this repo to tweak settings if you needs to.\n`
            + `  \n`
            + `  Then, finally, start tracking your repos by adding 'packages/releasator-gh-workflow/releasator.yaml' action to their workflows.\n`
            + `  Don't forget to set RELEASATOR_TOKEN secret in those repos.\n`
            + `  \n`
            + `  GL HF! ✨\n`
        );
    } else {
        // TODO  standalone input
    }


}

main().then(() => {
    process.exit(0);
}, (e) => {
    console.error(e);
    process.exit(1);
});
