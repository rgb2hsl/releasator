const emojis: Record<string, string[]> = {
    bug: ['✅','🛠️','🔧','🩹','🖥️'],
    feature: ['⭐','💡','✨','🏗'],
    update: ['🔥','💾'],
    else: ['💿','💻']
}

export function emojize(title: string, body: string) {
    const t = title.trim();
    const b = body.trim();

    const bugRegex = /(fix(es|ed|ing)?|repair(s|ed|ing)?|bug(s)?|issue(s)?|correct(s|ed|ing)?|resolve(s|d)?)/gi;
    const featureRegex = /(add(s|ed|ing)?|implement(s|ed|ing)?|new feature(s)?|create(s|d|ing)?|introduce(s|d|ing)?)/gi;
    const updateRegex = /(update(d|s)?|bump(s|ed|ing)?)/gi;

    let matches: Array<[string,number]> = [
        ["bug", (t.toLowerCase().match(bugRegex) ?? []).length + (b.match(bugRegex) ?? []).length * 0.5 ],
        ["feature", (t.match(featureRegex) ?? []).length * 1.1 + (b.match(featureRegex) ?? []).length * 0.6],
        ["update", (t.match(updateRegex) ?? []).length * 1.6 + (b.match(updateRegex) ?? []).length * 2 ]
    ];

    matches = matches.sort((a, b) => b[1] - a[1]);

    const key = matches[0][0];

    if (key in emojis) {
        const e = emojis[key];
        if (e.length) {
            const r = Math.floor(Math.random() * e.length);
            return e[r];
        }
    }

    const r = Math.floor(Math.random() * emojis.else.length);
    return emojis.else[r];
}
