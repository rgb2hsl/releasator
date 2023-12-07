export function extractJiraIssueIdFromURL(url: string) {
    const regex = /[A-Z]+-\d+/;
    const match = url.match(regex);

    if (match) {
        return match[0];
    }

    return undefined;
}
