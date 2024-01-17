# Set desireable database name
# For using scripts directly with npm run, put in in the begining with `DB=`
DB="RE-DB"

if [ -z "$DB" ]; then
    echo "▶️ ERROR 🐞: \$DB is not set."
    exit 1
fi

# Create wrangler.toml
echo "▶️: Creating wrangler.toml...";
npm run cfg -w packages/releasator-api > /dev/null 2>&1
EXIT_CODE=$?

WRANGLER_TOML="packages/releasator-api/wrangler.toml"

if [ $EXIT_CODE -ne 0 ]; then
    echo "▶️ ERROR 🐞: creating wrangler.toml failed with exit code $EXIT_CODE"
    echo "$OUTPUT"
    exit 2
else
    if [ ! -f "$WRANGLER_TOML" ]; then
        echo "▶️ ERROR 🐞: creating wrangler.toml exit with $EXIT_CODE but $WRANGLER_TOML don't exists"
        exit 3
    else
        echo "✅️: wrangler.toml created";
    fi
fi

# Create the database and capture the output
echo "▶️: Creating DB \"$DB\"...";
DBOUT=$(DB=$DB npm run db:create -w packages/releasator-api 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "▶️ ERROR 🐞: Creating DB \"$DB\" failed with exit code $EXIT_CODE. Full output:"
    echo $DBOUT
    exit 2
else
    echo "✅️: DB \"$DB\" created";
fi

echo "✅️: DB configuration is:";
grep -E "binding =|database_name =|database_id =" <<< "$DBOUT" | while read -r line; do
    echo $line;
    # Extract the key
    KEY=$(echo $line | awk '{print $1 " " $2}')
    VAL=$(echo $line | awk '{print $3}')

    # Update the wrangler.toml file
    sed -i "/^$KEY/cKEK" "$WRANGLER_TOML"
done

echo "Updated $WRANGLER_TOML successfully."

wrangler d1 delete RE-DB
