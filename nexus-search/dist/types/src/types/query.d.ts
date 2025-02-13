export interface QueryToken {
    type: 'operator' | 'modifier' | 'term';
    value: string;
    original: string;
    field?: string;
}
