export interface StorageEntry<T> {
    id: string;
    data: T;
    timestamp: number;
}
export interface StorageOptions {
    type: string;
    maxSize?: number;
    ttl?: number;
}
