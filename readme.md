# Releasator

"Revolutinary" changelog notification tool.

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

## Setup

Releasator is designed to be deployed within CF workers.

1. Fork this repo or simply clone it locally if you plan to deploy API and GUI manually. A GitHub fork is fine to use GitHub actions (or other CI tool) to run deploys. Both ways are ok.

## API and DB setup (cf worker)

1. Clone your fork (or this repo). Run `npm run cfg -w packages/releasator-api`.
   It will create `wrangler.toml` in `packages/releasator-api` folder. Open it and configure accoording to the
   comments and guides inside. **Its really important, don't skip a single comment line!**. `wrangler.toml` should be committed and removed from `.gitignore`, if you're using a fork pattern.
2. Upload and deploy your worker with `npm run deploy -w packages/releasator-api`

   You can check that everything goes fine by checking logs of a worker — a cronjob should run every minute and tell you
   that there is no releases queued for posting
3. Copy your worker URL. Let's call it your API root.

## GUI setup (cf pages)

1. Run `npm run cfg -w packages/releasator-gui`. It will create `.env` in `packages/releasator-gui`. file. Alike `wrangler.toml`, it should be commited and removed from `.gitignore`.
2. Add your API root url to `.env` in `packages/releasator-gui`.
3. Create CF pages by running `npm run setup -w packages/releasator-gui`. You can change project name if needed in `packages/releasator-gui/package.json`
4. Deploy GUI by runing `npm run deploy -w packages/releasator-gui`.
5. Go to your CF dashboard and copy deployed GUI url. Let's call it GUI root.
6. Return to the api's `wrangler.toml` and set a proper `GUI_ROOT` as you copied it above.
   Redeploy your worker with `npm run deploy -w packages/releasator-api`.

## Repos setup (gh actions)

0. If your repo hadn't `v*` tags before, push `v0.0.0` to the head of main right now. Or Releasator won't be able to calcuate a diff between nwe tags. It's made on purpose.
1. Add `packages/releasator-gh-workflow/releasator.yaml` to your `.github/workflows` folder in all repos, listed in API's service `SERVICE_CONFIG`'s `knownProducts` (and actually all repos, that should push release notes).
2. Add `RELEASATOR_TOKEN` secred also to all those repos from the previous step. `RELEASATOR_TOKEN` should be the same as `AUTH_SUPER_TOKEN` from API's `wrangler.toml`.
3. It's recommended to add protected tag rules to `v*` tags, allowing only `main` branch to have this tags pushed and allowing only listed users to push them.

Now everything should work. Make some changes, create some PR's and push a release tag. GitHub Action will push new release to API, API will post to your Slack about new release notes created and you can try follow the "Edit" link to the GUI. Read "Pull Requests rules" to understand how Releasator fetching PR's info into release notes.

## Pull Requests rules

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
