function generateRandomLetter(omitLetters: string[] = []): string {
    let letter = '';
    while (!letter || omitLetters.includes(letter)) {
        letter = String.fromCharCode(65 + Math.round(Math.random() * 25));
    }
    return letter;
}

export function generateGameCode(): string {
    const code = [generateRandomLetter()];
    for (let i = 1; i < 4; ++i) {
        const nextLetter = generateRandomLetter(code);
        code[i] = nextLetter;
    }

    return code.join('');
}
