import { DocumentLink, IndexedDocument } from "./document";
export interface SerializedTrieNode {
    isEndOfWord: boolean;
    documentRefs: string[];
    weight: number;
    children: {
        [key: string]: SerializedTrieNode;
    };
}
export interface SerializedState {
    trie: SerializedTrieNode;
    documents: [string, IndexedDocument][];
    documentLinks: [string, DocumentLink[]][];
}
