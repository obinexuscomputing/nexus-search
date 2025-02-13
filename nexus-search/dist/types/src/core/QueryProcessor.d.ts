export declare class QueryProcessor {
    private readonly STOP_WORDS;
    private readonly WORD_ENDINGS;
    private readonly SPECIAL_CHARS;
    process(query: string | null | undefined): string;
    private sanitizeQuery;
    private extractPhrases;
    private tokenize;
    private createToken;
    private processTokens;
    private shouldKeepToken;
    private normalizeToken;
    private normalizeWordEndings;
    private isNormalizationException;
    private normalizeGerund;
    private normalizePastTense;
    private normalizePlural;
    private reconstructQuery;
}
