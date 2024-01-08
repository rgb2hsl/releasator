# Releasator

_"Revolutinary" changelog notification tool. The name is too long, so I'll be using **Re** instead._

## How it works

If you work within GitHub, using "v*" tags to mark releases and using Slack to communicate — Releasator can help your
team to have insightful release notes automatically with each release.

Every time you'll put a "v*" tag Releasator will fetch the changes between current and previous version tag and form a
release notes from merged PR's.

For each PR it's title and first pagraph of text will be included to release notes. Also JIRA issues links and demo
links can be included for each PR.

At the end of release notes a full list of contributors will present. If contributors have Slack accounts — Releasator
can be configured to display them as Slack mentions.

Right after the release Relesator will queue the release notes for posting after a set amount of time. During that time
you have a possibility to edit them, add or delete features or correct smomething, reschedule posting.

## Setting up Pull Requests

1. **PR's title** will be included in the release notes as the feature's header.
   Keep it short yet clear for every person in company.

   A good question for the title is "what is changed in the product and where?"

   *Example: `SUM feature added to the cat's calculator's main page`*

2. A paragraph, starting with `Demo: ` (mind the space after ":"), containing a list of urls can be added at the PR's
   body, separated with comma `,`.
   All urls from it, filtered by allowed demo domains whitelist, will be included as demo references so people can check
   out the changes you've mentioned in the PR.

   Use this feature to provide team with a quick access to see the actual changes live.

   *Example: `Demo: https://cats.calculator.cat/, https://cats.calculator.cat/sum/` (mentioning previous example)*

3. A paragraph containing a related JIRA issue link (`https://%org_domain%.atlassian.net/browse/%issue_id%`) can be
   added at the PR's body. One paragraph for each issue. All issues will be included to the release notes.

   *Example: https://catscompany.atlassian.net/browse/CAT-31337*

4. First paragraph of text (excluding all paragraphs mentioned above) will be included as feature's description. Keep it clean and nice.

So far, a goof PR utilizing all features should look like this.

***

### SUM feature added to the cat's calculator's main page

Demo: https://cats.calculator.cat/, https://cats.calculator.cat/sum/

https://catscompany.atlassian.net/browse/CAT-31337

This feature added a possible to calculate a sum of cats during interacting with our fasinating main page. It brings happy and joy to every cat's owner in a world and it's a huge commit to our company's mission.

This paragraph will not be included in the release notes. And you are totally understand why, if you a good reader. If you're not — please, read the points above one more time.

***

## Setup

Re is designed to be deployed as CF workers, so some prequirements needed.

Steps to set up:

1. Fork this repo
2. Edit `packages/releasator-api/wrangler.toml` for your CF Worker:
    1. Create DB and add `d1_databases` bindings
    2. Edit `SERVICE_CONFIG`
3. Upload and deploy your worker with `npm run deploy -w packages/releasator-api`
4. Add secrets to the deployed worker:
    1. `AUTH_SUPER_TOKEN` is token you should use with Bearer auth to push releases from GitHub workflow
    2. `GITHUB_TOKEN` is token allowed to read from repos you wish to push releases from
    3. `SLACK_ADMIN_CHANNEL_WEBHOOK` is a webhook for posting service previews of release messsages
    4. `SLACK_NOTIFICATIONS_CHANNEL_WEBHOOK` is the same, but for "production" posting
5. You can check that everything goes fine by checking logs of a worker — a cronjob should run every minute and tell you
   that there is no releases queued for posting
6. Deploy GUI o CF pages

#### D1 Database

Create a database named `RE` with

```bash
npx wrangler d1 create RE
```

Wrangler will output a binding needed for your worker like this:

```bash
[[d1_databases]]
binding = "DB" # i.e. available in your Worker on env.DB
database_name = "RE"
database_id = "%your_unique_id%"
```

Initialize your DB with a SQL `sql/schema.sql`:

```bash
npx wrangler d1 execute RE --file=sql/schema.sql
```

For local initialization use `--local` flag:

```bash
npx wrangler d1 execute RE --local --file=sql/schema.sql
```
