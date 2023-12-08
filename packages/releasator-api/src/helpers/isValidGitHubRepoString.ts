export function isValidGitHubRepoString(repoString: string): boolean {
    const githubUsernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
    const parts = repoString.split('/');

    if (parts.length !== 2) {
        return false;
    }

    const [owner, repo] = parts;
    return githubUsernameRegex.test(owner) && githubUsernameRegex.test(repo);
}
