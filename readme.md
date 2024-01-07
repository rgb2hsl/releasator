# Releasator

_"Revolutinary" changelog notification tool. The name is too long, so I'll be using **Re** instead._

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
5. You can check that everything goes fine by checking logs of a worker — a cronjob should run every minute and tell you that there is no releases queued for posting
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
