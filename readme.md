# Releasator

_"Revolutinary" changelog notification tool. The name is too long, so I'll be using **Re** instead._

## Setup

Re is designed to be deployed as CF workers, so some prequirements needed.

#### Secrets

Add `AUTH_SUPER_TOKEN` secret to your worker's env variables. It's a master token used for authentication. Simply use Bearer scheme with all your requests.

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
