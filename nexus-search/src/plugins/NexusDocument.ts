import { SearchEngine } from "@/core";
import { 
    SearchOptions, 
    DocumentContent, 
    IndexNode,
} from "@/types";

import { IndexedDocument } from "@/storage";
import { AlgoUtils } from "@/utils/AlgoUtils";
import { ScoringUtils } from "@/utils/ScoringUtils";
import { 
    bfsRegexTraversal, 
    dfsRegexTraversal,
    normalizeFieldValue
} from "@/utils/SearchUtils";

import { PerformanceMonitor } from "@/utils/PerformanceUtils";
import { DocumentLink } from "@/core/DocumentLink";

interface NexusDocument {
    id: string;
    title: string;
    content: string;
    path: string;
    type: string;
    metadata?: Record<string, unknown>;
}


export class NexusDocumentAdapter {
    private documents: Map<string, NexusDocument>;
    private searchEngine: SearchEngine;
    private performanceMonitor: PerformanceMonitor;
    private documentLinks: DocumentLink[];

    constructor() {
        this.documents = new Map();
        this.documentLinks = [];
        this.performanceMonitor = new PerformanceMonitor();
        this.searchEngine = new SearchEngine({
            name: 'nexus-document-adapter',
            version: 1,
            fields: ['title', 'content', 'path', 'type'],
            storage: { type: 'memory' },
            indexing: {
                enabled: true,
                fields: ['title', 'content'],
                options: {
                    tokenization: true,
                    caseSensitive: false,
                    stemming: true
                }
            },
            searchFields: ['title', 'content'],
            metadataFields: ['path', 'type'],
            searchOptions: {
                fuzzy: true,
                maxDistance: 2,
                includeMatches: true
            }
        });
    }

    async addDocument(document: NexusDocument): Promise<void> {
        await this.performanceMonitor.measure('addDocument', async () => {
            this.documents.set(document.id, document);


            const indexedDoc = new IndexedDocument(
                document.id,
                {
                    title: normalizeFieldValue(document.title),
                    content: document.content as unknown as DocumentContent,
                    author: '',
                    tags: [],
                    version: '1.0'
                },
                document.metadata
            );

            await this.searchEngine.addDocument(indexedDoc);
        });
    }

    async removeDocumentById(id: string): Promise<void> {
        await this.performanceMonitor.measure('removeDocument', async () => {
            this.documents.delete(id);
            await this.searchEngine.removeDocument(id);
            this.documentLinks = this.documentLinks.filter(
                link => link.source !== id && link.target !== id
            );
        });
    }

    async search(query: string, options: Partial<SearchOptions> = {}): Promise<NexusDocument[]> {
        return await this.performanceMonitor.measure('search', async () => {
            const results = await this.searchEngine.search(query, {
                ...options,
                includeMatches: true
            });

            return results.map(result => {
                const doc = this.documents.get(result.docId);
                if (!doc) return null;
                return {
                    ...doc,
                    score: result.score,
                    matches: result.matches
                };
            }).filter(Boolean) as NexusDocument[];
        });
    }

    async addDocumentLink(fromId: string, toId: string, type: string): Promise<void> {
        if (this.documents.has(fromId) && this.documents.has(toId)) {
            this.documentLinks.push(new DocumentLink(fromId, toId, type));
        }
    }

    getDocuments(): NexusDocument[] {
        return Array.from(this.documents.values());
    }

    getPerformanceMetrics() {
        return this.performanceMonitor.getMetrics();
    }
}

export class NexusDocumentPlugin {
    private adapter: NexusDocumentAdapter;
    private root: IndexNode;
    documentLinks: never[] = [];

    constructor(adapter: NexusDocumentAdapter) {
        this.adapter = adapter;
        this.root = {
            id: '',
            value: '',
            score: 0,
            depth: 0,
            children: new Map()
        };
    }

    async indexDocuments(): Promise<number> {
        const mockDocuments: NexusDocument[] = [
            { 
                id: '1', 
                title: 'Doc1', 
                content: 'Content of Doc1', 
                path: '/docs/doc1.md', 
                type: 'md',
                metadata: {
                    lastModified: Date.now(),
                    author: 'System'
                }
            },
            { 
                id: '2', 
                title: 'Doc2', 
                content: 'Content of Doc2', 
                path: '/docs/doc2.html', 
                type: 'html',
                metadata: {
                    lastModified: Date.now(),
                    author: 'System'
                }
            }
        ];

        for (const doc of mockDocuments) {
            await this.adapter.addDocument(doc);
        }

        await this.adapter.addDocumentLink('1', '2', 'reference');

        return mockDocuments.length;
    }

    async bfsSearch(query: string): Promise<NexusDocument | null> {
        const results = bfsRegexTraversal(
            this.root,
            query,
            1,
            {
                maxDepth: 10,
                caseSensitive: false,
                wholeWord: true
            }
        );

        if (results.length === 0) return null;

        const doc = this.adapter.getDocuments().find(
            doc => doc.id === results[0].id
        );

        return doc || null;
    }

    async dfsSearch(query: string): Promise<NexusDocument | null> {
        const results = dfsRegexTraversal(
            this.root,
            query,
            1,
            {
                maxDepth: 10,
                caseSensitive: false,
                wholeWord: true
            }
        );

        if (results.length === 0) return null;

        const doc = this.adapter.getDocuments().find(
            doc => doc.id === results[0].id
        );

        return doc || null;
    }

    async searchWithRank(query: string): Promise<Array<NexusDocument & { rank: number }>> {
        const docs = this.adapter.getDocuments();
        const documentsMap = new Map(docs.map(doc => [doc.id, doc]));
        
        const documentRanks = ScoringUtils.calculateDocumentRanks(
            documentsMap,
            this.documentLinks || []
        );

        const results = AlgoUtils.enhancedSearch(
            this.root,
            query,
            documentsMap as unknown as Map<string, IndexedDocument>,
            this.documentLinks || []
        );

        return results.map(result => {
            const doc = this.adapter.getDocuments().find(d => d.id === result.id);
            if (!doc) return null;
            return {
                ...doc,
                rank: documentRanks.get(doc.id)?.rank || 0
            };
        }).filter(Boolean) as Array<NexusDocument & { rank: number }>;
    }
}