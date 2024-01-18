export function findVersionPatterns(str: string): string[] {
    const pattern = /^v\d+\.\d+\.\d+$/;
    const matches = str.match(pattern);
    return matches ?? [];
}

export function parseVersionFromTagRef(tagRef: string) {
    const version = findVersionPatterns(tagRef).pop() ?? "";

    const versionNumbers = version.substring(1).split(".").map(Number);

    if (versionNumbers.length !== 3) console.warn("can`t extract version from tag ref", tagRef);

    return versionNumbers;
}

export function findPreviousTagName(tagNames: string[], fromTagName: string): string | undefined {
    const currentVersion = parseVersionFromTagRef(fromTagName);

    console.info(`findPreviousTagName: currentVersion for "${fromTagName}" is `,JSON.stringify(currentVersion));

    if (currentVersion.length !== 3 || currentVersion.includes(NaN)) {
        return;
    }
    let sortedVersions;

    try {
        sortedVersions = tagNames
        .map(t => parseVersionFromTagRef(t))
        .filter(v => !v.includes(NaN) && v.length === 3)
        .sort((a, b) => {
            if (a.length !== 3 || b.length !== 3) throw new Error('Found incompatible version');
            for (let i = 0; i < 3; i++) {
                if (a[i] !== b[i]) return a[i] - b[i];
            }
            return 0;
        });
    } catch (e) {
        console.info(`findPreviousTagName: `, e);
        return;
    }

    for (let i = sortedVersions.length - 1; i >= 0; i--) {
        if (sortedVersions[i][0] < currentVersion[0] ||
            (sortedVersions[i][0] === currentVersion[0] && sortedVersions[i][1] < currentVersion[1]) ||
            (sortedVersions[i][0] === currentVersion[0] && sortedVersions[i][1] === currentVersion[1] && sortedVersions[i][2] < currentVersion[2])) {

            return `v${sortedVersions[i].join(".")}`;
        }
    }


}

