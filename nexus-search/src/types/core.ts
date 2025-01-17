import { IndexConfig } from "./compactability";
import { IndexedDocument } from "./document";

export interface IndexNode {
  depth: number;
  id: string;
  value: unknown;
  score: number;
  children: Map<string, IndexNode>;
}


export interface TokenInfo {
  value: string;
  type: 'word' | 'operator' | 'modifier' | 'delimiter';
  position: number;
  length: number;
}




export interface SerializedIndex {
  documents: Array<{
      key: string;
      value: IndexedDocument;
  }>;
  indexState: unknown;
  config: IndexConfig;
}