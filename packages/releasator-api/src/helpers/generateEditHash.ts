export async function generateEditHash(repoString: string, headTagName: string): Promise<string> {
    const randomArray = new Uint8Array(32);
    crypto.getRandomValues(randomArray);

    const encoder = new TextEncoder();
    const saltArray = encoder.encode((repoString + headTagName).substring(0, 32));

    const mixed = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        mixed[i] = (randomArray[i] + saltArray[i] || 0) % 256;
    }

    return Array.from(randomArray, byte => ("0" + byte.toString(16)).slice(-2)).join("");
}
