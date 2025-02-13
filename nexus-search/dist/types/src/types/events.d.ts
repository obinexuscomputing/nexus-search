export type SearchEventType = 'engine:initialized' | 'engine:closed' | 'index:start' | 'index:complete' | 'index:error' | 'index:clear' | 'index:clear:error' | 'search:start' | 'search:complete' | 'search:error' | 'update:start' | 'update:complete' | 'update:error' | 'remove:start' | 'remove:complete' | 'remove:error' | 'bulk:update:start' | 'bulk:update:complete' | 'bulk:update:error' | 'import:start' | 'import:complete' | 'import:error' | 'export:start' | 'export:complete' | 'export:error' | 'optimize:start' | 'optimize:complete' | 'optimize:error' | 'reindex:start' | 'reindex:complete' | 'reindex:error' | 'storage:error' | 'storage:clear' | 'storage:clear:error';
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
export declare class SearchEventError extends Error {
    readonly type: SearchEventType;
    readonly details?: unknown | undefined;
    constructor(message: string, type: SearchEventType, details?: unknown | undefined);
}
