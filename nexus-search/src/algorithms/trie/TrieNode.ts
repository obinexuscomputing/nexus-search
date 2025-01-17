export class TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;
    documentRefs: Set<string>;
    weight: number;
    frequency: number;
    lastAccessed: number;
    prefixCount: number;
    depth: number;

    constructor(depth: number = 0) {
        this.children = new Map();
        this.isEndOfWord = false;
        this.documentRefs = new Set();
        this.weight = 0.0;
        this.frequency = 0;
        this.lastAccessed = Date.now();
        this.prefixCount = 0;
        this.depth = depth;
    }

    addChild(char: string): TrieNode {
        const child = new TrieNode(this.depth + 1);
        this.children.set(char, child);
        return child;
    }

    getChild(char: string): TrieNode | undefined {
        return this.children.get(char);
    }

    hasChild(char: string): boolean {
        return this.children.has(char);
    }

    incrementWeight(value: number = 1.0): void {
        this.weight += value;
        this.frequency++;
        this.lastAccessed = Date.now();
    }

    decrementWeight(value: number = 1.0): void {
        this.weight = Math.max(0, this.weight - value);
        this.frequency = Math.max(0, this.frequency - 1);
    }

    clearChildren(): void {
        this.children.clear();
        this.documentRefs.clear();
        this.weight = 0;
        this.frequency = 0;
    }

    shouldPrune(): boolean {
        return this.children.size === 0 && 
               this.documentRefs.size === 0 && 
               this.weight === 0 &&
               this.frequency === 0;
    }

    getScore(): number {
        const recency = Math.exp(-(Date.now() - this.lastAccessed) / (24 * 60 * 60 * 1000)); // Decay over 24 hours
        return (this.weight * this.frequency * recency) / (this.depth + 1);
    }

    getWeight(): number {
        return this.weight;
    }
}