

import { IndexedDocument, DocumentLink, SearchOptions, SearchResult, DocumentBase} from "@/types";
import { TrieNode } from "./TrieNode";



export class TrieSearch {
    public insert(word: string, id: string): void {
        this.insertWord(word, id);
    }

    public removeData(id: string): void {
        this.removeDocument(id);
    }
    private root: TrieNode;
    private documents: Map<string, IndexedDocument>;
    private documentLinks: Map<string, DocumentLink[]>;
    private totalDocuments: number;
    private maxWordLength: number;

    constructor(maxWordLength: number = 50) {
        this.root = new TrieNode();
        this.documents = new Map();
        this.documentLinks = new Map();
        this.totalDocuments = 0;
        this.maxWordLength = maxWordLength;
    }

    public addDocument(document: IndexedDocument): void {
        if (!document.id) return;

        this.documents.set(document.id, document);
        this.totalDocuments++;

        // Index all text fields
        Object.values(document.fields).forEach(field => {
            if (typeof field === 'string') {
                this.indexText(field, document.id);
            } else if (Array.isArray(field)) {
                field.forEach(item => {
                    if (typeof item === 'string') {
                        this.indexText(item, document.id);
                    }
                });
            }
        });
    }

    private indexText(text: string, documentId: string): void {
        const words = this.tokenize(text);
        const uniqueWords = new Set(words);

        uniqueWords.forEach(word => {
            if (word.length <= this.maxWordLength) {
                this.insertWord(word, documentId);
            }
        });
    }

    private insertWord(word: string, documentId: string): void {
        let current = this.root;
        current.prefixCount++;

        for (const char of word) {
            if (!current.hasChild(char)) {
                current = current.addChild(char);
            } else {
                current = current.getChild(char)!;
            }
            current.prefixCount++;
        }

        current.isEndOfWord = true;
        current.documentRefs.add(documentId);
        current.incrementWeight();
    }

    public searchWord(term: string): SearchResult[] {
        return this.search(term);
    }

    public search(query: string, options: SearchOptions = {}): SearchResult[] {
        const {
            fuzzy = false,
            maxDistance = 2,
            prefixMatch = false,
            maxResults = 10,
            minScore = 0.1,
            caseSensitive = false
        } = options;

        const words = this.tokenize(query, caseSensitive);
        const results = new Map<string, SearchResult>();

        words.forEach(word => {
            let matches: SearchResult[] = [];

            if (fuzzy) {
                matches = this.fuzzySearch(word, maxDistance);
            } else if (prefixMatch) {
                matches = this.prefixSearch(word);
            } else {
                matches = this.exactSearch(word);
            }

            matches.forEach(match => {
                const existing = results.get(match.docId);
                if (!existing || existing.score < match.score) {
                    results.set(match.docId, match);
                }
            });
        });

        return Array.from(results.values())
            .filter(result => result.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
    }

    private exactSearch(word: string): SearchResult[] {
        const results: SearchResult[] = [];
        let current = this.root;

        for (const char of word) {
            if (!current.hasChild(char)) {
                return results;
            }
            current = current.getChild(char)!;
        }

        if (current.isEndOfWord) {
            current.documentRefs.forEach(docId => {
                results.push({
                    docId,
                    score: this.calculateScore(current, word),
                    term: word,
                    id: "",
                    document: this.documents.get(docId)!,
                    item: undefined,
                    matches: []
                });
            });
        }

        return results;
    }

    public exportState(): unknown {
        return {
            trie: this.serializeTrie(this.root),
            documents: Array.from(this.documents.entries()),
            documentLinks: Array.from(this.documentLinks.entries()),
            totalDocuments: this.totalDocuments,
            maxWordLength: this.maxWordLength
        };
    }

    private prefixSearch(prefix: string): SearchResult[] {
        const results: SearchResult[] = [];
        let current = this.root;

        // Navigate to prefix node
        for (const char of prefix) {
            if (!current.hasChild(char)) {
                return results;
            }
            current = current.getChild(char)!;
        }

        // Collect all words with this prefix
        this.collectWords(current, prefix, results);
        return results;
    }
public serializeState(): unknown {
    return {
        trie: this.serializeTrie(this.root),
        documents: Array.from(this.documents.entries()),
        documentLinks: Array.from(this.documentLinks.entries()),
        totalDocuments: this.totalDocuments,
        maxWordLength: this.maxWordLength
    };
}
public deserializeState(state: unknown): void {
    if (!state || typeof state !== 'object') {
        throw new Error('Invalid state data');
    }

    const typedState = state as {
        trie: unknown;
        documents: [string, IndexedDocument][];
        documentLinks: [string, DocumentLink[]][];
        totalDocuments: number;
        maxWordLength: number;
    };

    this.root = this.deserializeTrie(typedState.trie as { prefixCount: number; isEndOfWord: boolean; documentRefs: string[]; children: Record<string, unknown> });
    this.documents = new Map(typedState.documents);
    this.documentLinks = new Map(typedState.documentLinks);
    this.totalDocuments = typedState.totalDocuments || 0;
    this.maxWordLength = typedState.maxWordLength || 50;
}


private serializeTrie(node: TrieNode): unknown {
    const serializedNode = {
        prefixCount: node.prefixCount,
        isEndOfWord: node.isEndOfWord,
        documentRefs: Array.from(node.documentRefs),
        weight: node.getWeight(),
        children: {} as Record<string, unknown>
    };

    node.children.forEach((child, char) => {
        serializedNode.children[char] = this.serializeTrie(child);
    });

    return serializedNode;
}


public addData(documentId: string, content: string, document: IndexedDocument): void {
    if (!documentId || typeof content !== 'string') return;
    
    interface NormalizedDocument extends IndexedDocument {
        clone: () => NormalizedDocument;
        update: (updates: Partial<NormalizedDocument>) => NormalizedDocument;
        toObject: () => NormalizedDocument;
    }

    const normalizedDocument: NormalizedDocument = {
        id: documentId,
        fields: {
            content: { text: content },
            title: document.fields.title || '',
            author: document.fields.author || '',
            tags: Array.isArray(document.fields.tags) ? [...document.fields.tags] : [],
            version: document.fields.version || '1.0'
        },
        metadata: document.metadata ? { ...document.metadata } : undefined,
        versions: Array.isArray(document.versions) ? [...document.versions] : [],
        relations: Array.isArray(document.relations) ? [...document.relations] : [],
        document: () => document,
        clone: () => ({ ...normalizedDocument }),
        update: (updates: Partial<NormalizedDocument>) => ({ ...normalizedDocument, ...updates }),
        toObject: () => ({ ...normalizedDocument }),
        base: function (): DocumentBase {
            throw new Error("Function not implemented.");
        },
        title: "",
        author: "",
        tags: [],
        version: ""
    };

    this.addDocument(normalizedDocument);
}

private deserializeTrie(data: { prefixCount: number; isEndOfWord: boolean; documentRefs: string[]; children: Record<string, unknown> }): TrieNode {
    const node = new TrieNode();
    node.prefixCount = data.prefixCount;
    node.isEndOfWord = data.isEndOfWord;
    node.documentRefs = new Set(data.documentRefs);

    for (const char in data.children) {
        node.children.set(char, this.deserializeTrie(data.children[char] as { prefixCount: number; isEndOfWord: boolean; documentRefs: string[]; children: Record<string, unknown> }));
    }

    return node;
}

    private collectWords(node: TrieNode, currentWord: string, results: SearchResult[]): void {
        if (node.isEndOfWord) {
            node.documentRefs.forEach(docId => {
                results.push({
                    docId,
                    score: this.calculateScore(node, currentWord),
                    term: currentWord,
                    id: "",
                    document: this.documents.get(docId)!,
                    item: undefined,
                    matches: []
                });
            });
        }

        node.children.forEach((child, char) => {
            this.collectWords(child, currentWord + char, results);
        });
    }

    public fuzzySearch(word: string, maxDistance: number): SearchResult[] {
        const results: SearchResult[] = [];
        
        const searchState = {
            word,
            maxDistance,
            results
        };

        this.fuzzySearchRecursive(this.root, "", 0, 0, searchState);
        return results;
    }

    private fuzzySearchRecursive(
        node: TrieNode, 
        current: string,
        currentDistance: number,
        depth: number,
        state: { word: string; maxDistance: number; results: SearchResult[] }
    ): void {
        if (currentDistance > state.maxDistance) return;

        if (node.isEndOfWord) {
            const distance = this.calculateLevenshteinDistance(state.word, current);
            if (distance <= state.maxDistance) {
                node.documentRefs.forEach(docId => {
                    return state.results.push({
                        docId,
                        score: this.calculateFuzzyScore(node, current, distance),
                        term: current,
                        distance,
                        id: "",
                        document: this.documents.get(docId)!,
                        item: undefined,
                        matches: []
                    });
                });
            }
        }

        node.children.forEach((child, char) => {
            // Try substitution
            const substitutionCost = char !== state.word[depth] ? 1 : 0;
            this.fuzzySearchRecursive(
                child, 
                current + char, 
                currentDistance + substitutionCost,
                depth + 1,
                state
            );

            // Try insertion
            this.fuzzySearchRecursive(
                child,
                current + char,
                currentDistance + 1,
                depth,
                state
            );

            // Try deletion
            if (depth < state.word.length) {
                this.fuzzySearchRecursive(
                    node,
                    current,
                    currentDistance + 1,
                    depth + 1,
                    state
                );
            }
        });
    }

    private calculateScore(node: TrieNode, term: string): number {
        const tfIdf = (node.frequency / this.totalDocuments) * 
                     Math.log(this.totalDocuments / node.documentRefs.size);
        const positionBoost = 1 / (node.depth + 1);
        const lengthNorm = 1 / Math.sqrt(term.length);

        return node.getScore() * tfIdf * positionBoost * lengthNorm;
    }

    private calculateFuzzyScore(node: TrieNode, term: string, distance: number): number {
        const exactScore = this.calculateScore(node, term);
        return exactScore * Math.exp(-distance);
    }

    private calculateLevenshteinDistance(s1: string, s2: string): number {
        const dp: number[][] = Array(s1.length + 1).fill(0)
            .map(() => Array(s2.length + 1).fill(0));

        for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
        for (let j = 0; j <= s2.length; j++) dp[0][j] = j;

        for (let i = 1; i <= s1.length; i++) {
            for (let j = 1; j <= s2.length; j++) {
                const substitutionCost = s1[i - 1] !== s2[j - 1] ? 1 : 0;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,              // deletion
                    dp[i][j - 1] + 1,              // insertion
                    dp[i - 1][j - 1] + substitutionCost  // substitution
                );
            }
        }

        return dp[s1.length][s2.length];
    }

    private tokenize(text: string, caseSensitive: boolean = false): string[] {
        const normalized = caseSensitive ? text : text.toLowerCase();
        return normalized
            .split(/[\s,.!?;:'"()[\]{}/\\]+/)
            .filter(word => word.length > 0);
    }

    public removeDocument(documentId: string): void {
        // Remove document references and update weights
        this.removeDocumentRefs(this.root, documentId);
        this.documents.delete(documentId);
        this.documentLinks.delete(documentId);
        this.totalDocuments = Math.max(0, this.totalDocuments - 1);
        this.pruneEmptyNodes(this.root);
    }

    private removeDocumentRefs(node: TrieNode, documentId: string): void {
        if (node.documentRefs.has(documentId)) {
            node.documentRefs.delete(documentId);
            node.decrementWeight();
            node.prefixCount = Math.max(0, node.prefixCount - 1);
        }

        node.children.forEach(child => {
            this.removeDocumentRefs(child, documentId);
        });
    }

    private pruneEmptyNodes(node: TrieNode): boolean {
        // Remove empty child nodes
        node.children.forEach((child, char) => {
            if (this.pruneEmptyNodes(child)) {
                node.children.delete(char);
            }
        });

        return node.shouldPrune();
    }

    public getSuggestions(prefix: string, maxResults: number = 5): string[] {
        let current = this.root;
        
        // Navigate to prefix node
        for (const char of prefix) {
            if (!current.hasChild(char)) {
                return [];
            }
            current = current.getChild(char)!;
        }

        // Collect suggestions
        const suggestions: Array<{ word: string; score: number }> = [];
        this.collectSuggestions(current, prefix, suggestions);

        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(suggestion => suggestion.word);
    }

    private collectSuggestions(
        node: TrieNode, 
        currentWord: string, 
        suggestions: Array<{ word: string; score: number }>
    ): void {
        if (node.isEndOfWord) {
            suggestions.push({
                word: currentWord,
                score: node.getScore()
            });
        }

        node.children.forEach((child, char) => {
            this.collectSuggestions(child, currentWord + char, suggestions);
        });
    }

    public clear(): void {
        this.root = new TrieNode();
        this.documents.clear();
        this.documentLinks.clear();
        this.totalDocuments = 0;
    }
}