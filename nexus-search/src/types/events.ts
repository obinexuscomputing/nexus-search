export type SearchEventType =
    // Engine lifecycle events
    | 'engine:initialized'
    | 'engine:closed'
    
    // Index operations
    | 'index:start'
    | 'index:complete'
    | 'index:error'
    | 'index:clear'
    | 'index:clear:error'
    
    // Search operations
    | 'search:start'
    | 'search:complete'
    | 'search:error'
    
    // Document operations
    | 'update:start'
    | 'update:complete'
    | 'update:error'
    | 'remove:start'
    | 'remove:complete'
    | 'remove:error'
    
    // Bulk operations
    | 'bulk:update:start'
    | 'bulk:update:complete'
    | 'bulk:update:error'
    
    // Import/Export operations
    | 'import:start'
    | 'import:complete'
    | 'import:error'
    | 'export:start'
    | 'export:complete'
    | 'export:error'
    
    // Optimization operations
    | 'optimize:start'
    | 'optimize:complete'
    | 'optimize:error'
    
    // Reindex operations
    | 'reindex:start'
    | 'reindex:complete'
    | 'reindex:error'
    
    // Storage operations
    | 'storage:error'
    | 'storage:clear'
    | 'storage:clear:error';

export interface BaseEvent {
    timestamp: number;
    region?: string;
}

export interface SuccessEvent extends BaseEvent {
    data?: {
        documentCount?: number;
        searchTime?: number;
        resultCount?: number;
        documentId?: string;
        updateCount?: number;
        query?: string;
        options?: unknown;
    };
}

export interface ErrorEvent extends BaseEvent {
    error: Error;
    details?: {
        documentId?: string;
        operation?: string;
        phase?: string;
    };
}

export interface SearchEvent extends BaseEvent {
    type: SearchEventType;
    data?: unknown;
    error?: Error;
    regex?: RegExp;
}

export interface IndexNode {
    id?: string;
    value?: unknown;
    score: number;
    children: Map<string, IndexNode>;
}

export interface SearchEventListener {
    (event: SearchEvent): void;
}

export interface SearchEventEmitter {
    addEventListener(listener: SearchEventListener): void;
    removeEventListener(listener: SearchEventListener): void;
    emitEvent(event: SearchEvent): void;
}

export class SearchEventError extends Error {
    constructor(
        message: string,
        public readonly type: SearchEventType,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'SearchEventError';
    }
}