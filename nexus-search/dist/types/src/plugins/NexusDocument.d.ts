import { SearchOptions } from "@/types";
interface NexusDocument {
    id: string;
    title: string;
    content: string;
    path: string;
    type: string;
    metadata?: Record<string, unknown>;
}
export declare class NexusDocumentAdapter {
    private documents;
    private searchEngine;
    private performanceMonitor;
    private documentLinks;
    constructor();
    addDocument(document: NexusDocument): Promise<void>;
    removeDocumentById(id: string): Promise<void>;
    search(query: string, options?: Partial<SearchOptions>): Promise<NexusDocument[]>;
    addDocumentLink(fromId: string, toId: string, type: string): Promise<void>;
    getDocuments(): NexusDocument[];
    getPerformanceMetrics(): import("@/types").MetricsResult;
}
export declare class NexusDocumentPlugin {
    private adapter;
    private root;
    documentLinks: never[];
    constructor(adapter: NexusDocumentAdapter);
    indexDocuments(): Promise<number>;
    bfsSearch(query: string): Promise<NexusDocument | null>;
    dfsSearch(query: string): Promise<NexusDocument | null>;
    searchWithRank(query: string): Promise<Array<NexusDocument & {
        rank: number;
    }>>;
}
export {};
