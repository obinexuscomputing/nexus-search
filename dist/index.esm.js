/**
 * @obinexuscomputing/nexus-search v1.0.0
 * undefined
 * @license MIT 
 */
import { openDB } from 'idb';

class CacheManager {
    constructor(maxSize = 1000, ttlMinutes = 5) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttlMinutes * 60 * 1000;
    }
    set(key, data) {
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (this.isExpired(entry.timestamp)) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    isExpired(timestamp) {
        return Date.now() - timestamp > this.ttl;
    }
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
    clear() {
        this.cache.clear();
    }
}

class IndexedDB {
    constructor() {
        this.db = null;
        this.DB_NAME = 'nexus_search_db';
        this.DB_VERSION = 1;
        this.initPromise = null;
        // Initialize immediately to catch early failures
        this.initPromise = this.initialize();
    }
    async initialize() {
        if (this.db)
            return;
        try {
            this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    // Handle version upgrades
                    if (!db.objectStoreNames.contains('searchIndices')) {
                        const indexStore = db.createObjectStore('searchIndices', { keyPath: 'id' });
                        indexStore.createIndex('timestamp', 'timestamp');
                    }
                    if (!db.objectStoreNames.contains('metadata')) {
                        const metaStore = db.createObjectStore('metadata', { keyPath: 'id' });
                        metaStore.createIndex('lastUpdated', 'lastUpdated');
                    }
                },
                blocked() {
                    console.warn('Database upgrade was blocked');
                },
                blocking() {
                    console.warn('Current database version is blocking a newer version');
                },
                terminated() {
                    console.error('Database connection was terminated');
                }
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Storage initialization failed: ${message}`);
        }
    }
    async ensureConnection() {
        if (this.initPromise) {
            await this.initPromise;
        }
        if (!this.db) {
            throw new Error('Database connection not available');
        }
    }
    async storeIndex(key, data) {
        await this.ensureConnection();
        try {
            const entry = {
                id: key,
                data,
                timestamp: Date.now(),
            };
            await this.db.put('searchIndices', entry);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to store index: ${message}`);
        }
    }
    async getIndex(key) {
        await this.ensureConnection();
        try {
            const entry = await this.db.get('searchIndices', key);
            return entry?.data || null;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to retrieve index: ${message}`);
        }
    }
    async updateMetadata(config) {
        await this.ensureConnection();
        try {
            const metadata = {
                id: 'config', // Set id field
                config,
                lastUpdated: Date.now()
            };
            await this.db.put('metadata', metadata); // No need to spread, directly use metadata
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to update metadata: ${message}`);
        }
    }
    async getMetadata() {
        await this.ensureConnection();
        try {
            const result = await this.db.get('metadata', 'config');
            return result || null; // Return `null` if `result` is `undefined`
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to retrieve metadata: ${message}`);
        }
    }
    async clearIndices() {
        await this.ensureConnection();
        try {
            await this.db.clear('searchIndices');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to clear indices: ${message}`);
        }
    }
    async deleteIndex(key) {
        await this.ensureConnection();
        try {
            await this.db.delete('searchIndices', key);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to delete index: ${message}`);
        }
    }
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
class SearchStorage {
    constructor() {
        this.db = null;
        this.DB_NAME = 'nexus_search_db';
        this.DB_VERSION = 1;
        this.initPromise = null;
        // Initialize immediately to catch early failures
        this.initPromise = this.initialize();
    }
    async initialize() {
        if (this.db)
            return;
        try {
            this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    // Handle version upgrades
                    if (!db.objectStoreNames.contains('searchIndices')) {
                        const indexStore = db.createObjectStore('searchIndices', { keyPath: 'id' });
                        indexStore.createIndex('timestamp', 'timestamp');
                    }
                    if (!db.objectStoreNames.contains('metadata')) {
                        const metaStore = db.createObjectStore('metadata', { keyPath: 'id' });
                        metaStore.createIndex('lastUpdated', 'lastUpdated');
                    }
                },
                blocked() {
                    console.warn('Database upgrade was blocked');
                },
                blocking() {
                    console.warn('Current database version is blocking a newer version');
                },
                terminated() {
                    console.error('Database connection was terminated');
                }
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Storage initialization failed: ${message}`);
        }
    }
    async ensureConnection() {
        if (this.initPromise) {
            await this.initPromise;
        }
        if (!this.db) {
            throw new Error('Database connection not available');
        }
    }
    async storeIndex(key, data) {
        await this.ensureConnection();
        try {
            const entry = {
                id: key,
                data,
                timestamp: Date.now(),
            };
            await this.db.put('searchIndices', entry);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to store index: ${message}`);
        }
    }
    async getIndex(key) {
        await this.ensureConnection();
        try {
            const entry = await this.db.get('searchIndices', key);
            return entry?.data || null;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to retrieve index: ${message}`);
        }
    }
    async updateMetadata(config) {
        await this.ensureConnection();
        try {
            const metadata = {
                id: 'config', // Set id field directly
                config,
                lastUpdated: Date.now()
            };
            await this.db.put('metadata', metadata); // Use metadata directly
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to update metadata: ${message}`);
        }
    }
    async getMetadata() {
        await this.ensureConnection();
        try {
            const result = await this.db.get('metadata', 'config');
            return result || null; // Return `null` if `result` is `undefined`
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to retrieve metadata: ${message}`);
        }
    }
    async clearIndices() {
        await this.ensureConnection();
        try {
            await this.db.clear('searchIndices');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to clear indices: ${message}`);
        }
    }
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

function createSearchableFields(document, fields) {
    const searchableFields = {};
    fields.forEach(field => {
        const value = getNestedValue(document, field);
        if (value !== undefined) {
            searchableFields[field] = normalizeFieldValue(value);
        }
    });
    return searchableFields;
}
function normalizeFieldValue(value) {
    if (typeof value === 'string') {
        return value.toLowerCase().trim();
    }
    if (Array.isArray(value)) {
        return value.map(v => normalizeFieldValue(v)).join(' ');
    }
    if (typeof value === 'object' && value !== null) {
        return Object.values(value).map(v => normalizeFieldValue(v)).join(' ');
    }
    return String(value);
}
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key] !== undefined ? current[key] : undefined, obj);
}
function optimizeIndex(data) {
    // Remove duplicates
    const uniqueData = Array.from(new Set(data.map(item => JSON.stringify(item)))).map(item => JSON.parse(item));
    // Sort for binary search optimization
    return uniqueData.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }
    async measure(name, fn) {
        const start = performance.now();
        try {
            return await fn();
        }
        finally {
            const duration = performance.now() - start;
            this.recordMetric(name, duration);
        }
    }
    recordMetric(name, duration) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push(duration);
    }
    getMetrics() {
        const results = {};
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
    average(numbers) {
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    clear() {
        this.metrics.clear();
    }
}

function validateSearchOptions(options) {
    if (options.maxResults && options.maxResults < 1) {
        throw new Error('maxResults must be greater than 0');
    }
    if (options.threshold && (options.threshold < 0 || options.threshold > 1)) {
        throw new Error('threshold must be between 0 and 1');
    }
    if (options.fields && !Array.isArray(options.fields)) {
        throw new Error('fields must be an array');
    }
}
function validateIndexConfig(config) {
    if (!config.name) {
        throw new Error('Index name is required');
    }
    if (!config.version || typeof config.version !== 'number') {
        throw new Error('Valid version number is required');
    }
    if (!Array.isArray(config.fields) || config.fields.length === 0) {
        throw new Error('At least one field must be specified for indexing');
    }
}
function validateDocument(document, fields) {
    return fields.every(field => {
        const value = getNestedValue(document, field);
        return value !== undefined;
    });
}

class DataMapper {
    constructor() {
        this.dataMap = new Map();
    }
    mapData(key, documentId) {
        if (!this.dataMap.has(key)) {
            this.dataMap.set(key, new Set());
        }
        this.dataMap.get(key).add(documentId);
    }
    getDocuments(key) {
        return this.dataMap.get(key) || new Set();
    }
    getAllKeys() {
        return Array.from(this.dataMap.keys());
    }
    exportState() {
        const serializedMap = {};
        this.dataMap.forEach((value, key) => {
            serializedMap[key] = Array.from(value);
        });
        return serializedMap;
    }
    importState(state) {
        this.dataMap.clear();
        Object.entries(state).forEach(([key, value]) => {
            this.dataMap.set(key, new Set(value));
        });
    }
    clear() {
        this.dataMap.clear();
    }
}

class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        this.documentRefs = new Set();
        this.weight = 0.0;
    }
}

class TrieSearch {
    constructor() {
        this.root = new TrieNode();
        this.documents = new Map();
        this.documentLinks = new Map();
    }
    insert(word, documentId) {
        let current = this.root;
        for (const char of word.toLowerCase()) {
            if (!current.children.has(char)) {
                current.children.set(char, new TrieNode());
            }
            current = current.children.get(char);
        }
        current.isEndOfWord = true;
        current.documentRefs.add(documentId);
    }
    search(prefix, maxResults = 10) {
        const results = new Set();
        let current = this.root;
        // Navigate to prefix endpoint
        for (const char of prefix.toLowerCase()) {
            if (!current.children.has(char)) {
                return results;
            }
            current = current.children.get(char);
        }
        // Collect all document references below this point
        this.collectDocumentRefs(current, results, maxResults);
        return results;
    }
    fuzzySearch(word, maxDistance = 2) {
        const results = new Set();
        this.fuzzySearchHelper(word.toLowerCase(), this.root, '', maxDistance, results);
        return results;
    }
    collectDocumentRefs(node, results, maxResults) {
        if (node.isEndOfWord) {
            for (const docId of node.documentRefs) {
                if (results.size >= maxResults)
                    return;
                results.add(docId);
            }
        }
        for (const child of node.children.values()) {
            if (results.size >= maxResults)
                return;
            this.collectDocumentRefs(child, results, maxResults);
        }
    }
    fuzzySearchHelper(word, node, currentWord, maxDistance, results) {
        if (maxDistance < 0)
            return;
        if (node.isEndOfWord) {
            const distance = this.calculateLevenshteinDistance(word, currentWord);
            if (distance <= maxDistance) {
                node.documentRefs.forEach(id => results.add(id));
            }
        }
        if (maxDistance > 0) {
            for (const [char, childNode] of node.children) {
                // Handle substitution
                const newDistance = word[currentWord.length] !== char ? maxDistance - 1 : maxDistance;
                this.fuzzySearchHelper(word, childNode, currentWord + char, newDistance, results);
            }
        }
    }
    calculateLevenshteinDistance(s1, s2) {
        const dp = Array(s1.length + 1).fill(0)
            .map(() => Array(s2.length + 1).fill(0));
        for (let i = 0; i <= s1.length; i++)
            dp[i][0] = i;
        for (let j = 0; j <= s2.length; j++)
            dp[0][j] = j;
        for (let i = 1; i <= s1.length; i++) {
            for (let j = 1; j <= s2.length; j++) {
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (s1[i - 1] !== s2[j - 1] ? 1 : 0));
            }
        }
        return dp[s1.length][s2.length];
    }
    /**
   * Exports the trie state for persistence
   * @returns Serialized trie state
   */
    exportState() {
        return {
            trie: this.serializeNode(this.root),
            documents: Array.from(this.documents.entries()),
            documentLinks: Array.from(this.documentLinks.entries())
        };
    }
    /**
     * Imports a previously exported trie state
     * @param state The state to import
     */
    importState(state) {
        this.root = this.deserializeNode(state.trie);
        if (state.documents) {
            this.documents = new Map(state.documents);
        }
        if (state.documentLinks) {
            this.documentLinks = new Map(state.documentLinks);
        }
    }
    /**
     * Serializes a TrieNode for persistence
     */
    serializeNode(node) {
        const children = {};
        node.children.forEach((childNode, char) => {
            children[char] = this.serializeNode(childNode);
        });
        return {
            isEndOfWord: node.isEndOfWord,
            documentRefs: Array.from(node.documentRefs),
            children
        };
    }
    /**
     * Deserializes a node from its serialized form
     */
    deserializeNode(serialized) {
        const node = new TrieNode();
        node.isEndOfWord = serialized.isEndOfWord;
        node.documentRefs = new Set(serialized.documentRefs);
        Object.entries(serialized.children).forEach(([char, childData]) => {
            node.children.set(char, this.deserializeNode(childData));
        });
        return node;
    }
    /**
     * Clears all data from the trie
     */
    clear() {
        this.root = new TrieNode();
        this.documents.clear();
        this.documentLinks.clear();
    }
    /**
     * Gets the current size of the trie
     */
    getSize() {
        return this.documents.size;
    }
}

class IndexMapper {
    constructor() {
        this.dataMapper = new DataMapper();
        this.trieSearch = new TrieSearch();
    }
    indexDocument(document, id, fields) {
        fields.forEach(field => {
            const value = document[field];
            if (typeof value === 'string') {
                const words = this.tokenizeText(value);
                words.forEach(word => {
                    this.trieSearch.insert(word, id);
                    this.dataMapper.mapData(word.toLowerCase(), id);
                });
            }
        });
    }
    search(query, options = {}) {
        const { fuzzy = false, maxResults = 10 } = options;
        const searchTerms = this.tokenizeText(query);
        const documentScores = new Map();
        searchTerms.forEach(term => {
            const documentIds = fuzzy
                ? this.trieSearch.fuzzySearch(term)
                : this.trieSearch.search(term, maxResults);
            documentIds.forEach(id => {
                const current = documentScores.get(id) || { score: 0, matches: new Set() };
                current.score += this.calculateScore(id, term);
                current.matches.add(term);
                documentScores.set(id, current);
            });
        });
        const results = Array.from(documentScores.entries())
            .map(([id, { score, matches }]) => ({
            item: id,
            score: score / searchTerms.length,
            matches: Array.from(matches)
        }))
            .sort((a, b) => b.score - a.score);
        return results.slice(0, maxResults);
    }
    exportState() {
        return {
            trie: this.trieSearch.exportState(),
            dataMap: this.dataMapper.exportState()
        };
    }
    importState(state) {
        if (!state || !state.trie || !state.dataMap) {
            throw new Error('Invalid index state');
        }
        this.trieSearch = new TrieSearch();
        this.trieSearch.importState(state.trie);
        this.dataMapper = new DataMapper();
        this.dataMapper.importState(state.dataMap);
    }
    tokenizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }
    calculateScore(documentId, term) {
        const baseScore = this.dataMapper.getDocuments(term.toLowerCase()).has(documentId) ? 1.0 : 0.5;
        return baseScore;
    }
    clear() {
        this.trieSearch = new TrieSearch();
        this.dataMapper = new DataMapper();
    }
}

class IndexManager {
    constructor(config) {
        this.config = config;
        this.indexMapper = new IndexMapper();
        this.documents = new Map();
    }
    async addDocuments(documents) {
        documents.forEach((doc, index) => {
            const id = this.generateDocumentId(index);
            this.documents.set(id, doc);
            const searchableFields = createSearchableFields(doc, this.config.fields);
            this.indexMapper.indexDocument(searchableFields, id, this.config.fields);
        });
    }
    async search(query, options) {
        const searchResults = this.indexMapper.search(query, {
            fuzzy: options.fuzzy,
            maxResults: options.maxResults
        });
        return searchResults.map(result => ({
            item: this.documents.get(result.item),
            score: result.score,
            matches: result.matches
        }));
    }
    exportIndex() {
        // Convert Map to a serializable format and include indexMapper state
        return {
            documents: Array.from(this.documents.entries()).map(([key, value]) => ({
                key,
                value: JSON.parse(JSON.stringify(value)) // Handle potential proxy objects
            })),
            indexState: this.indexMapper.exportState(),
            config: JSON.parse(JSON.stringify(this.config)) // Ensure config is serializable
        };
    }
    importIndex(data) {
        if (!data || !data.documents || !data.indexState || !data.config) {
            throw new Error('Invalid index data format');
        }
        try {
            // Restore documents
            this.documents = new Map(data.documents.map((item) => [item.key, item.value]));
            // Restore config
            this.config = data.config;
            // Restore index mapper state
            this.indexMapper = new IndexMapper();
            this.indexMapper.importState(data.indexState);
        }
        catch (error) {
            throw new Error(`Failed to import index: ${error}`);
        }
    }
    clear() {
        this.documents.clear();
        this.indexMapper = new IndexMapper();
    }
    generateDocumentId(index) {
        return `${this.config.name}-${index}-${Date.now()}`;
    }
}

class QueryProcessor {
    constructor() {
        this.STOP_WORDS = new Set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
            'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
            'that', 'the', 'to', 'was', 'were', 'will', 'with'
        ]);
    }
    process(query) {
        const tokens = this.tokenize(query);
        const processedTokens = this.processTokens(tokens);
        return this.optimizeQuery(processedTokens);
    }
    tokenize(query) {
        return query
            .toLowerCase()
            .split(/\s+/)
            .filter(term => term.length > 0)
            .map(term => this.classifyToken(term));
    }
    classifyToken(term) {
        if (term.startsWith('+') || term.startsWith('-')) {
            return { type: 'operator', value: term };
        }
        if (term.includes(':')) {
            return { type: 'modifier', value: term };
        }
        return { type: 'term', value: term };
    }
    processTokens(tokens) {
        return tokens
            .filter(token => token.type !== 'term' || !this.STOP_WORDS.has(token.value))
            .map(token => this.normalizeToken(token));
    }
    normalizeToken(token) {
        if (token.type === 'term') {
            // Basic stemming (could be enhanced with proper stemming algorithm)
            let value = token.value;
            if (value.endsWith('ing'))
                value = value.slice(0, -3);
            if (value.endsWith('s'))
                value = value.slice(0, -1);
            return { ...token, value };
        }
        return token;
    }
    optimizeQuery(tokens) {
        return tokens
            .map(token => token.value)
            .join(' ');
    }
}

class SearchEngine {
    constructor(config) {
        this.config = config;
        this.indexManager = new IndexManager(config);
        this.queryProcessor = new QueryProcessor();
        this.storage = new SearchStorage();
        this.cache = new CacheManager();
    }
    async initialize() {
        try {
            await this.storage.initialize();
            await this.loadIndexes();
        }
        catch (error) {
            throw new Error(`Failed to initialize search engine: ${error}`);
        }
    }
    async addDocuments(documents) {
        try {
            await this.indexManager.addDocuments(documents);
            await this.storage.storeIndex(this.config.name, this.indexManager.exportIndex());
        }
        catch (error) {
            throw new Error(`Failed to add documents: ${error}`);
        }
    }
    async search(query, options = {}) {
        validateSearchOptions(options);
        const cacheKey = this.generateCacheKey(query, options);
        const cachedResults = this.cache.get(cacheKey);
        if (cachedResults) {
            return cachedResults;
        }
        const processedQuery = this.queryProcessor.process(query);
        const results = await this.indexManager.search(processedQuery, options);
        this.cache.set(cacheKey, results);
        return results;
    }
    async loadIndexes() {
        const storedIndex = await this.storage.getIndex(this.config.name);
        if (storedIndex) {
            this.indexManager.importIndex(storedIndex);
        }
    }
    generateCacheKey(query, options) {
        return `${query}-${JSON.stringify(options)}`;
    }
    async clearIndex() {
        await this.storage.clearIndices();
        this.indexManager.clear();
        this.cache.clear();
    }
}

// Define the namespace
var NexusSearch;
(function (NexusSearch) {
    // Constants
    NexusSearch.DEFAULT_INDEX_OPTIONS = {
        caseSensitive: false,
        stemming: true,
        stopWords: ['the', 'a', 'an', 'and', 'or', 'but'],
        minWordLength: 2,
        maxWordLength: 50,
        fuzzyThreshold: 0.8
    };
    NexusSearch.DEFAULT_SEARCH_OPTIONS = {
        fuzzy: false,
        maxResults: 10,
        threshold: 0.5,
        fields: [],
        sortBy: 'score',
        sortOrder: 'desc',
        page: 1,
        pageSize: 10
    };
    // Error types
    class SearchError extends Error {
        constructor(message) {
            super(message);
            this.name = 'SearchError';
        }
    }
    NexusSearch.SearchError = SearchError;
    class IndexError extends Error {
        constructor(message) {
            super(message);
            this.name = 'IndexError';
        }
    }
    NexusSearch.IndexError = IndexError;
    // Type guards
    function isSearchOptions(obj) {
        return obj && (typeof obj.fuzzy === 'undefined' || typeof obj.fuzzy === 'boolean') && (typeof obj.maxResults === 'undefined' || typeof obj.maxResults === 'number');
    }
    NexusSearch.isSearchOptions = isSearchOptions;
    function isIndexConfig(obj) {
        return obj &&
            typeof obj.name === 'string' &&
            typeof obj.version === 'number' &&
            Array.isArray(obj.fields);
    }
    NexusSearch.isIndexConfig = isIndexConfig;
    function isSearchResult(obj) {
        return obj &&
            'item' in obj &&
            typeof obj.score === 'number' &&
            Array.isArray(obj.matches);
    }
    NexusSearch.isSearchResult = isSearchResult;
})(NexusSearch || (NexusSearch = {}));
// Make namespace the default export
var NexusSearch$1 = NexusSearch;

export { CacheManager, DataMapper, IndexManager, IndexMapper, IndexedDB, NexusSearch, PerformanceMonitor, QueryProcessor, SearchEngine, TrieNode, TrieSearch, createSearchableFields, NexusSearch$1 as default, getNestedValue, normalizeFieldValue, optimizeIndex, validateDocument, validateIndexConfig, validateSearchOptions };
//# sourceMappingURL=index.esm.js.map
