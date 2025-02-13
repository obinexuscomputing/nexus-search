export declare class DataMapper {
    private dataMap;
    constructor();
    mapData(key: string, documentId: string): void;
    getDocuments(key: string): Set<string>;
    getDocumentById(documentId: string): Set<string>;
    getAllKeys(): string[];
    removeDocument(documentId: string): void;
    removeKey(key: string): void;
    exportState(): Record<string, string[]>;
    importState(state: Record<string, string[]>): void;
    clear(): void;
}
