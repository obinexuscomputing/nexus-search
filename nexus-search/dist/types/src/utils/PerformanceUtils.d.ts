import { MetricsResult } from "@/types";
export declare class PerformanceMonitor {
    private metrics;
    constructor();
    measure<T>(name: string, fn: () => Promise<T>): Promise<T>;
    private recordMetric;
    getMetrics(): MetricsResult;
    private average;
    clear(): void;
}
