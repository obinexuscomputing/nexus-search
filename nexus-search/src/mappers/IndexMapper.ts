import { TrieSearch } from "@/algorithms/trie";
import { 
    IndexedDocument, 
    SearchableDocument, 
    SearchResult, 
    SerializedState,
    DocumentValue,
    DocumentContent,
    DocumentBase,

} from "@/types";
import { DataMapper } from "./DataMapper";

interface DocumentScore {
    score: number;
    matches: Set<string>;
}

export class IndexMapper {
    private dataMapper: DataMapper;
    private trieSearch: TrieSearch;
    private documents: Map<string, IndexedDocument>;
    private documentScores: Map<string, DocumentScore>;

    constructor(state?: { dataMap?: Record<string, string[]> }) {
        this.dataMapper = new DataMapper();
        if (state?.dataMap) {
            this.dataMapper.importState(state.dataMap);
        }
        this.trieSearch = new TrieSearch();
        this.documents = new Map();
        this.documentScores = new Map();
    }

    indexDocument(document: SearchableDocument, id: string, fields: string[]): void {
        try {
            if (!document.content) return;

            // Create normalized IndexedDocument
            const indexedDoc: IndexedDocument = {
                id,
                fields: {
                    title: String(document.content.title || ''),
                    content: document.content.content as DocumentContent,
                    author: String(document.content.author || ''),
                    tags: Array.isArray(document.content.tags) ? document.content.tags.filter(tag => typeof tag === 'string') : [],
                    version: String(document.content.version || '1.0'),
                    ...document.content
                },
                metadata: document.metadata || {},
                versions: [],
                relations: [],
                document: function () { return this; },
                base: function (): DocumentBase {
                    throw new Error("Function not implemented.");
                },
                title: "",
                author: "",
                tags: [],
                version: ""
            };

            // Store document
            this.documents.set(id, indexedDoc);

            // Index each field
            fields.forEach(field => {
                const value = document.content[field];
                if (value !== undefined && value !== null) {
                    const textValue = this.normalizeValue(value);
                    const words = this.tokenizeText(textValue);
                    
                    words.forEach(word => {
                        if (word) {
                            // Add word to trie with reference to document
                            this.trieSearch.insert(word, id);
                            this.dataMapper.mapData(word.toLowerCase(), id);
                        }
                    });
                }
            });
        } catch (error) {
            console.error(`Error indexing document ${id}:`, error);
            throw new Error(`Failed to index document: ${error}`);
        }
    }

    search(query: string, options: { fuzzy?: boolean; maxResults?: number } = {}): SearchResult<string>[] {
        try {
            const { fuzzy = false, maxResults = 10 } = options;
            const searchTerms = this.tokenizeText(query);

            this.documentScores.clear();

          
searchTerms.forEach(term => {

    if (!term) return;



    const matchedIds = fuzzy 

        ? this.trieSearch.fuzzySearch(term, 2) // Provide a default maxDistance value

        : this.trieSearch.search(term);



    matchedIds.forEach((docId: string | SearchResult<unknown>) => {
        if (typeof docId !== 'string') return;

      

        const current: DocumentScore = this.documentScores.get(docId) || {



            score: 0,



            matches: new Set<string>()



        };

        current.score += this.calculateScore(docId, term);

        current.matches.add(term);

        this.documentScores.set(docId, current);

    });

})

            return Array.from(this.documentScores.entries())
                .map(([docId, { score, matches }]): SearchResult<string> => ({
                    id: docId,
                    document: this.documents.get(docId) as IndexedDocument,
                    item: docId,
                    score: score / searchTerms.length,
                    matches: Array.from(matches),
                    metadata: this.documents.get(docId)?.metadata,
                    docId: docId,
                    term: searchTerms.join(' ')
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, maxResults);
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    private normalizeValue(value: DocumentValue): string {
        if (typeof value === 'string') {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map(v => this.normalizeValue(v as DocumentValue)).join(' ');
        }
        if (typeof value === 'object' && value !== null) {
            return Object.values(value)
                .map(v => this.normalizeValue(v as DocumentValue))
                .join(' ');
        }
        return String(value);
    }

    private tokenizeText(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    private calculateScore(documentId: string, term: string): number {
        const baseScore = this.dataMapper.getDocuments(term.toLowerCase()).has(documentId) ? 1.0 : 0.5;
        const termFrequency = this.calculateTermFrequency(documentId, term);
        return baseScore * (1 + termFrequency);
    }

    private calculateTermFrequency(documentId: string, term: string): number {
        const doc = this.documents.get(documentId);
        if (!doc) return 0;

        const content = Object.values(doc.fields).join(' ').toLowerCase();
        const regex = new RegExp(term, 'gi');
        const matches = content.match(regex);
        return matches ? matches.length : 0;
    }

    removeDocument(id: string): void {
        this.trieSearch.removeData(id);
        this.dataMapper.removeDocument(id);
        this.documents.delete(id);
        this.documentScores.delete(id);
    }

    addDocument(document: SearchableDocument, id: string, fields: string[]): void {
        this.indexDocument(document, id, fields);
    }

    updateDocument(document: SearchableDocument, id: string, fields: string[]): void {
        this.removeDocument(id);
        this.indexDocument(document, id, fields);
    }

    getDocumentById(id: string): IndexedDocument | undefined {
        return this.documents.get(id);
    }

    getAllDocuments(): Map<string, IndexedDocument> {
        return new Map(this.documents);
    }

    exportState(): unknown {
        return {
            trie: this.trieSearch.exportState(),
            dataMap: this.dataMapper.exportState(),
            documents: Array.from(this.documents.entries())
        };
    }

    importState(state: { 
        trie: SerializedState; 
        dataMap: Record<string, string[]>;
        documents?: [string, IndexedDocument][];
    }): void {
        if (!state || !state.trie || !state.dataMap) {
            throw new Error('Invalid index state');
        }

        this.trieSearch = new TrieSearch();
        this.trieSearch.deserializeState(state.trie);
        
        const newDataMapper = new DataMapper();
        newDataMapper.importState(state.dataMap);
        this.dataMapper = newDataMapper;

        if (state.documents) {
            this.documents = new Map(state.documents);
        }
    }

    clear(): void {
        this.trieSearch = new TrieSearch();
        this.dataMapper = new DataMapper();
        this.documents.clear();
        this.documentScores.clear();
    }
}