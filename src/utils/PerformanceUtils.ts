

export class PerformanceMonitor {
    private metrics: Map<string, number[]>;
    
    constructor() {
      this.metrics = new Map();
    }
  
    async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const start = performance.now();
      try {
        return await fn();
      } finally {
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
      }
    }
  
    private recordMetric(name: string, duration: number): void {
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(duration);
    }
  
    getMetrics(): Record<string, { 
      avg: number; 
      min: number; 
      max: number; 
      count: number; 
    }> {
      const results: Record<string, any> = {};
      
      this.metrics.forEach((durations, name) => {
        results[name] = {
          avg: this.average(durations),
          min: Math.min(...durations),
          max: Math.max(...durations),
          count: durations.length,
        };
      });
      
      return results;
    }
  
    private average(numbers: number[]): number {
      return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
  
    clear(): void {
      this.metrics.clear();
    }
  }