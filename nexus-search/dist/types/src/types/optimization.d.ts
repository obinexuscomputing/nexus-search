export interface OptimizationOptions {
    deduplication?: boolean;
    sorting?: boolean;
    compression?: boolean;
}
export interface OptimizationResult<T> {
    data: T[];
    stats: {
        originalSize: number;
        optimizedSize: number;
        compressionRatio?: number;
    };
}
