export function findGitHubRevert(body: string) {
    const regex = /Reverts\s+([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)#(\d+)/;

    const match = body.match(regex);

    if (match) {
        return {
            repo: `${match[1]}/${match[2]}`,
            prNumber: match[3]
        };
    } else {
        return undefined;
    }
}
