import { SearchOptions, IndexConfig, SearchableDocument } from "@/types";
export declare function validateSearchOptions(options: SearchOptions): void;
export declare function validateIndexConfig(config: IndexConfig): void;
export declare function validateDocument(document: SearchableDocument, fields: string[]): boolean;
