export class DataMapper {
  private dataMap: Map<string, Set<string>>;

  constructor() {
    this.dataMap = new Map();
  }

  mapData(key: string, documentId: string): void {
    if (!this.dataMap.has(key)) {
      this.dataMap.set(key, new Set());
    }
    this.dataMap.get(key)?.add(documentId) ?? new Set().add(documentId);
  }

  getDocuments(key: string): Set<string> {
    return this.dataMap.get(key) || new Set();
  }

  getDocumentById(documentId: string): Set<string> {
    const documents = new Set<string>();
    this.dataMap.forEach(value => {
      if (value.has(documentId)) {
        documents.add(documentId);
      }
    }
    );
    return documents;
  }

  getAllKeys(): string[] {
    return Array.from(this.dataMap.keys());
  }

  removeDocument(documentId: string): void {
    this.dataMap.forEach(value => {
      value.delete(documentId);
    });
  }



  removeKey(key: string): void {
    this.dataMap.delete(key);
  }
  
  exportState(): Record<string, string[]> {
    const serializedMap: Record<string, string[]> = {};
    
    this.dataMap.forEach((value, key) => {
      serializedMap[key] = Array.from(value);
    });

    return serializedMap;
  }

  importState(state: Record<string, string[]>): void {
    this.dataMap.clear();
    
    Object.entries(state).forEach(([key, value]) => {
      this.dataMap.set(key, new Set(value));
    });
  }

  clear(): void {
    this.dataMap.clear();
  }
}