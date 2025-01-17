import { IndexedDocument } from "@/storage";
import { 
    IndexNode, 
    OptimizationResult, 
    SearchableDocument,
    DocumentValue,
    RegexSearchResult,
    RegexSearchConfig} from "@/types";

/**
 * Performs an optimized Breadth-First Search traversal with regex matching
 */
export function bfsRegexTraversal(
    root: IndexNode,
    pattern: string | RegExp,
    maxResults: number = 10,
    config: RegexSearchConfig = {}
): RegexSearchResult[] {
    const {
        maxDepth = 50,
        timeoutMs = 5000,
        caseSensitive = false,
        wholeWord = false
    } = config;

    const regex = createRegexPattern(pattern, { caseSensitive, wholeWord });
    const results: RegexSearchResult[] = [];
    const queue: Array<{ 
        node: IndexNode; 
        matched: string; 
        depth: number;
        path: string[];
    }> = [];
    const visited = new Set<string>();
    const startTime = Date.now();

    queue.push({ 
        node: root, 
        matched: '', 
        depth: 0,
        path: []
    });

    while (queue.length > 0 && results.length < maxResults) {
        if (Date.now() - startTime > timeoutMs) {
            console.warn('BFS regex search timeout');
            break;
        }

        const current = queue.shift()!;
        const { node, matched, depth, path } = current;

        if (depth > maxDepth) continue;

        if (regex.test(matched) && node.id && !visited.has(node.id)) {
            results.push({
                id: node.id,
                score: calculateRegexMatchScore(node, matched, regex),
                matches: [matched],
                path: [...path],
                positions: findMatchPositions(matched, regex)
            });
            visited.add(node.id);
        }

        for (const [char, childNode] of node.children.entries()) {
            queue.push({
                node: childNode,
                matched: matched + char,
                depth: depth + 1,
                path: [...path, char]
            });
        }
    }

    return results.sort((a, b) => b.score - a.score);
}

/**
 * Performs an optimized Depth-First Search traversal with regex matching
 */
export function dfsRegexTraversal(
    root: IndexNode,
    pattern: string | RegExp,
    maxResults: number = 10,
    config: RegexSearchConfig = {}
): RegexSearchResult[] {
    const {
        maxDepth = 50,
        timeoutMs = 5000,
        caseSensitive = false,
        wholeWord = false
    } = config;

    const regex = createRegexPattern(pattern, { caseSensitive, wholeWord });
    const results: RegexSearchResult[] = [];
    const visited = new Set<string>();
    const startTime = Date.now();

    function dfs(
        node: IndexNode, 
        matched: string, 
        depth: number,
        path: string[]
    ): void {
        if (results.length >= maxResults || 
            depth > maxDepth || 
            Date.now() - startTime > timeoutMs) {
            return;
        }

        if (regex.test(matched) && node.id && !visited.has(node.id)) {
            results.push({
                id: node.id,
                score: calculateRegexMatchScore(node, matched, regex),
                matches: [matched],
                path: [...path],
                positions: findMatchPositions(matched, regex)
            });
            visited.add(node.id);
        }

        for (const [char, childNode] of node.children.entries()) {
            dfs(
                childNode, 
                matched + char, 
                depth + 1,
                [...path, char]
            );
        }
    }

    dfs(root, '', 0, []);
    return results.sort((a, b) => b.score - a.score);
}

/**
 * Helper function to create a properly configured regex pattern
 */
function createRegexPattern(
    pattern: string | RegExp,
    options: { caseSensitive?: boolean; wholeWord?: boolean }
): RegExp {
    const { caseSensitive = false, wholeWord = false } = options;
    
    if (pattern instanceof RegExp) {
        const flags = `${caseSensitive ? '' : 'i'}${pattern.global ? 'g' : ''}`;
        return new RegExp(pattern.source, flags);
    }

    let source = pattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (wholeWord) {
        source = `\\b${source}\\b`;
    }

    return new RegExp(source, caseSensitive ? 'g' : 'ig');
}

/**
 * Calculate a score for regex matches based on various factors
 */
function calculateRegexMatchScore(
    node: IndexNode,
    matched: string,
    regex: RegExp
): number {
    const baseScore = node.score || 1;
    const matches = matched.match(regex) || [];
    const matchCount = matches.length;
    const matchQuality = matches.reduce((sum, match) => sum + match.length, 0) / matched.length;
    const depthPenalty = 1 / (node.depth || 1);

    return baseScore * matchCount * matchQuality * depthPenalty;
}

/**
 * Find all match positions in the text for highlighting
 */
function findMatchPositions(text: string, regex: RegExp): Array<[number, number]> {
    const positions: Array<[number, number]> = [];
    let match: RegExpExecArray | null;
    
    const globalRegex = new RegExp(regex.source, regex.flags + (regex.global ? '' : 'g'));
    
    while ((match = globalRegex.exec(text)) !== null) {
        positions.push([match.index, match.index + match[0].length]);
    }
    
    return positions;
}


/**
 * Optimizes an array of indexable documents
 */
export function optimizeIndex<T extends IndexedDocument>(
    data: T[]
): OptimizationResult<T> {
    if (!Array.isArray(data)) {
        return {
            data: [],
            stats: { originalSize: 0, optimizedSize: 0, compressionRatio: 1 }
        };
    }

    try {
        const uniqueMap = new Map<string, T>();
        data.forEach(item => {
            const key = JSON.stringify(sortObjectKeys(item));
            uniqueMap.set(key, item);
        });

        const sorted = Array.from(uniqueMap.values())
            .sort((a, b) => generateSortKey(a).localeCompare(generateSortKey(b)));

        return {
            data: sorted,
            stats: {
                originalSize: data.length,
                optimizedSize: sorted.length,
                compressionRatio: data.length ? sorted.length / data.length : 1
            }
        };
    } catch (error) {
        console.warn('Error optimizing index:', error);
        return {
            data,
            stats: {
                originalSize: data.length,
                optimizedSize: data.length,
                compressionRatio: 1
            }
        };
    }
}

/**
 * Helper function to sort object keys recursively
 */
export function sortObjectKeys<T extends object>(obj: T): T {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys) as unknown as T;
    }

    return Object.keys(obj)
        .sort()
        .reduce((sorted, key) => {
            const value = (obj as Record<string, unknown>)[key];
            (sorted as Record<string, unknown>)[key] = typeof value === 'object' && value !== null ? sortObjectKeys(value) : value;
            return sorted;
        }, {} as T);
}

/**
 * Helper function to generate consistent sort keys for documents
 */
export function generateSortKey(doc: IndexedDocument): string {
    if (!doc?.id || !doc.content) {
        return '';
    }

    try {
        return `${doc.id}:${Object.keys(doc.content).sort().join(',')}`;
    } catch {
        return doc.id;
    }
}



export function createSearchableFields(
    document: SearchableDocument,
    fields: string[]
): Record<string, string> {
    if (!document?.content) {
        return {};
    }

    const result: Record<string, string> = {};
    
    for (const field of fields) {
        const value = getNestedValue(document.content, field);
        if (value !== undefined) {
            // Store both original and normalized values for better matching
            result[`${field}_original`] = String(value);
            result[field] = normalizeFieldValue(value as DocumentValue);
        }
    }

    return result;
}

export function normalizeFieldValue(value: DocumentValue): string {
    if (!value) return '';

    try {
        if (typeof value === 'string') {
            // Preserve original case but remove extra whitespace
            return value.trim().replace(/\s+/g, ' ');
        }

        if (Array.isArray(value)) {
            return value
                .map(v => normalizeFieldValue(v as DocumentValue))
                .filter(Boolean)
                .join(' ');
        }

        if (typeof value === 'object') {
            return Object.values(value)
                .map(v => normalizeFieldValue(v as DocumentValue))
                .filter(Boolean)
                .join(' ');
        }

        return String(value).trim();
    } catch (error) {
        console.warn('Error normalizing field value:', error);
        return '';
    }
}

export function getNestedValue(obj: unknown, path: string): unknown {
    if (!obj || !path) return undefined;

    try {
        return path.split('.').reduce<unknown>((current, key) => {
            return (current as Record<string, unknown>)?.[key];
        }, obj as Record<string, unknown>);
    } catch (error) {
        console.warn(`Error getting nested value for path ${path}:`, error);
        return undefined;
    }
}

export function calculateScore(
    document: IndexedDocument,
    query: string,
    field: string,
    options: {
        fuzzy?: boolean;
        caseSensitive?: boolean;
        exactMatch?: boolean;
        fieldWeight?: number;
    } = {}
): number {
    const {
        fuzzy = false,
        caseSensitive = false,
        exactMatch = false,
        fieldWeight = 1
    } = options;

    const fieldValue = document.fields[field];
    if (!fieldValue) return 0;

    const documentText = String(fieldValue);
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const fieldText = caseSensitive ? documentText : documentText.toLowerCase();

    let score = 0;

    // Exact match check
    if (exactMatch && fieldText === searchQuery) {
        return 1 * fieldWeight;
    }

    // Regular word matching
    const queryWords = searchQuery.split(/\s+/);
    const fieldWords = fieldText.split(/\s+/);

    for (const queryWord of queryWords) {
        for (const fieldWord of fieldWords) {
            if (fuzzy) {
                const distance = calculateLevenshteinDistance(queryWord, fieldWord);
                const maxLength = Math.max(queryWord.length, fieldWord.length);
                const similarity = 1 - (distance / maxLength);
                
                if (similarity >= 0.8) { // Adjust threshold as needed
                    score += similarity * fieldWeight;
                }
            } else if (fieldWord.includes(queryWord)) {
                score += fieldWeight;
            }
        }
    }

    // Normalize score
    return Math.min(score / queryWords.length, 1);
}

export function calculateLevenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j],     // deletion
                    dp[i][j - 1],     // insertion
                    dp[i - 1][j - 1]  // substitution
                ) + 1;
            }
        }
    }

    return dp[m][n];
}

export function extractMatches(
    document: IndexedDocument,
    query: string,
    fields: string[],
    options: { fuzzy?: boolean; caseSensitive?: boolean } = {}
): string[] {
    const matches = new Set<string>();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    for (const field of fields) {
        const fieldValue = document.fields[field];
        if (!fieldValue) continue;

        const fieldText = options.caseSensitive ? 
            String(fieldValue) : 
            String(fieldValue).toLowerCase();

        if (options.fuzzy) {
            // For fuzzy matching, find similar substrings
            const words = fieldText.split(/\s+/);
            const queryWords = searchQuery.split(/\s+/);

            for (const queryWord of queryWords) {
                for (const word of words) {
                    const distance = calculateLevenshteinDistance(queryWord, word);
                    if (distance <= Math.min(2, Math.floor(word.length / 3))) {
                        matches.add(word);
                    }
                }
            }
        } else {
            // For exact matching, find all occurrences
            const regex = new RegExp(searchQuery, 'gi');
            let match;
            while ((match = regex.exec(fieldText)) !== null) {
                matches.add(match[0]);
            }
        }
    }

    return Array.from(matches);
}