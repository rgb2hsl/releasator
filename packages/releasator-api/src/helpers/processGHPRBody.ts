export function processGHPRBody(body: string, allowedDemoDomains: string[]) {
    // divide body into paragraphs
    const paragraphs = body.split(/\r?\n/);

    let jiraUrls: string[] = [];
    let demoUrls: string[] = [];

    const jiraRegex = /https:\/\/[a-zA-Z0-9.-]+\/browse\/[A-Z]+-\d+/g;
    const demoRegex = /https:\/\/[a-zA-Z0-9/._-]+/g;
    const allowedDemoRegex = new RegExp(`https://[a-zA-Z0-9.-]?(${allowedDemoDomains.join('|')})/[a-zA-Z0-9/._-]?`, 'g');

    const remainingParagraphs = paragraphs.filter(paragraph => {
        // Extracting JIRA links
        if (jiraRegex.test(paragraph)) {
            jiraUrls = [...jiraUrls, ...(paragraph.match(jiraRegex) ?? [])];
            return false; // Remove this paragraph
        }

        // Extracting DEMO links
        if (paragraph.startsWith("Demo:")) {
            demoUrls = [...demoUrls, ...(paragraph.match(demoRegex) ?? [])];
            return false; // Remove this paragraph
        }

        // it's empty?
        return paragraph.trim().length;
    });

    demoUrls = demoUrls.filter(link => allowedDemoRegex.test(link));

    const firstParagraph = remainingParagraphs[0] ?? "";

    return {
        firstParagraph,
        jiraUrls,
        demoUrls
    };
}
