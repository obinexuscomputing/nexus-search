export interface QueryToken {

  type: 'operator' | 'modifier' | 'term';

  value: string;

  original: string;

  field?: string; // Add the optional field property

}