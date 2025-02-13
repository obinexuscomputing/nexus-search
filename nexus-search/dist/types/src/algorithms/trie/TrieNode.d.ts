export declare class TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;
    documentRefs: Set<string>;
    weight: number;
    frequency: number;
    lastAccessed: number;
    prefixCount: number;
    depth: number;
    constructor(depth?: number);
    addChild(char: string): TrieNode;
    getChild(char: string): TrieNode | undefined;
    hasChild(char: string): boolean;
    incrementWeight(value?: number): void;
    decrementWeight(value?: number): void;
    clearChildren(): void;
    shouldPrune(): boolean;
    getScore(): number;
    getWeight(): number;
}
