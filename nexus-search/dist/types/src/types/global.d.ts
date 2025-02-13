import type { NexusSearch } from '../index';
declare global {
    interface Window {
        NexusSearch: typeof NexusSearch;
    }
}
export {};
