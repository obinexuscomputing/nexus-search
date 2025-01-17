export class SearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchError';
  }
}

export class IndexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IndexError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

export class MapperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MapperError';
  }
}

export class PerformanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PerformanceError';
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

