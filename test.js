import { APIConfigSchema } from "releasator-types";
import { promisify } from "util";
import { exec, spawn } from "child_process";
import { existsSync, promises } from "fs";
import chalk from 'chalk';
import readline from "readline";

/*
    CONFIGURATION
    Change variables below to suit your setup
    --------------------------------------------------------------------------------------------------------------------
 */

const FLOW_USE_EXISTING_PAGES_PROJECT = true; // default is false
const FLOW_USE_EXISTING_DATABASE = true; // default is false

const FORK_MODE = true;

const PROJECT_PREFIX = "my"; // change to your company or project shortname

const CF_API_PROJECT_NAME = `releasator-api-${PROJECT_PREFIX.toLowerCase().trim()}`; // for your CF dashboard
const CF_GUI_PROJECT_NAME = `releasator-gui-${PROJECT_PREFIX.toLowerCase().trim()}`; // for your CF dashboard
const CF_PROFILE = "my-cf-username"; // first part pf your email, used in CF

const API_DB_NAME = `RE-${PROJECT_PREFIX.toUpperCase().trim()}-DB`
const API_CONFIG_DRAFT = {
    allowedDemoDomains: ['google.com'], // allowed domains for demo
    knownContributors: [{ "githubLogin": "rgb2hsl", "slackUID": "U0000000000" }], // for Slack mentions
    knownProducts: [{ 'repoString': 'rgb2hsl/releasator', 'name': 'Releasator' }], // for product names in release notes
    notificationServices: ['slack'], // currently only slack avaiable
    notificationDelayMinutes: 15, // time from release notes creation to posting in into channel
};

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
    console.info(`${stepNumber(++stepCounter)}: ${chalk.bgCyan(name)}`);
}

function infoOut(info) {
    console.info(`↘️: ${info}`);
}

function successOut(success) {
    console.info(`✅️: ${success}`);
}

function errorOut(error) {
    console.info(`❌: ${error}`);
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
            return replace?.[1] || line;
        } else {
            return line;
        }
    }).join('\n');

    await promises.writeFile(path, content, 'utf8');
}

function main() {
    function runCommandWithUserInput(command, args) {
        const child = spawn(command, args);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        child.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output);

            if (output.includes("was last published via")) {
                rl.question('Y/n', (answer) => {
                    child.stdin.write(answer + '\n');
                });
            }
        });

        child.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        child.on('close', (code) => {
            console.log(`Child process exited with code ${code}`);
            rl.close();
        });
    }

// Пример использования
    runCommandWithUserInput('npm', ['run', 'deploy', '-w', 'packages/releasator-api']);
}

main();
