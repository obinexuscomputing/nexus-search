class NexusSearchBar {
    private container: HTMLElement;
    private searchEngine: any;
    private searchTimeout: number | null;
    private posts: any[];

    // Cache DOM elements
    private input: HTMLInputElement | null;
    private spinner: HTMLElement | null;
    private errorMessage: HTMLElement | null;
    private resultsContainer: HTMLElement | null;
    private noResults: HTMLElement | null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.searchEngine = null;
        this.searchTimeout = null;
        this.posts = [];

        // Cache DOM elements
        this.input = container.querySelector('.search-input');
        this.spinner = container.querySelector('.loading-spinner');
        this.errorMessage = container.querySelector('.error-message');
        this.resultsContainer = container.querySelector('.search-results');
        this.noResults = container.querySelector('.no-results');

        this.initialize();
    }

    async fetchPosts(): Promise<any[]> {
        try {
            this.showLoading();

            const [postsResponse, commentsResponse] = await Promise.all([
                fetch('https://jsonplaceholder.typicode.com/posts'),
                fetch('https://jsonplaceholder.typicode.com/comments')
            ]);

            if (!postsResponse.ok || !commentsResponse.ok) {
                throw new Error('Failed to fetch data from the API');
            }

            const posts = await postsResponse.json();
            const comments = await commentsResponse.json();

            const commentsByPost = comments.reduce((acc: Record<number, any[]>, comment: any) => {
                if (!acc[comment.postId]) acc[comment.postId] = [];
                acc[comment.postId].push(comment);
                return acc;
            }, {});

            return posts.map((post: any) => ({
                id: `post-${post.id}`,  // Ensure unique ID
                title: this.capitalizeFirstLetter(post.title),
                content: this.capitalizeFirstLetter(post.body),
                tags: [
                    'blog',
                    `user-${post.userId}`,
                    `post-${post.id}`,
                    ...(commentsByPost[post.id] ? ['has-comments'] : [])
                ],
                comments: commentsByPost[post.id] || [],
                author: `User ${post.userId}`,
                type: 'post'  // Add type for consistent document structure
            }));

        } catch (error) {
            throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.hideLoading();
        }
    }

    capitalizeFirstLetter(string: string): string {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
    }

    async initialize(): Promise<void> {
        try {
            this.showLoading();

            // Check for NexusSearch library with more robust check
            if (typeof window === 'undefined' || !window.NexusSearch || !window.NexusSearch.SearchEngine) {
                throw new Error('NexusSearch library not loaded or incomplete');
            }

            // Initialize search engine with robust configuration
            this.searchEngine = new window.NexusSearch.SearchEngine({
                name: 'nexus-search-bar',
                version: 1,
                fields: ['title', 'content', 'tags', 'author', 'type'],
                storage: { type: 'memory' }  // Specify storage type
            });

            await this.searchEngine.initialize();

            // Fetch and add posts with error handling
            this.posts = await this.fetchPosts();
            
            // Validate documents before adding
            const validDocuments = this.posts.filter(doc => 
                doc.id && doc.title && doc.content
            );

            if (validDocuments.length === 0) {
                throw new Error('No valid documents to add to search index');
            }

            await this.searchEngine.addDocuments(validDocuments);

            this.setupEventListeners();

        } catch (error) {
            this.showError(`Initialization error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.hideLoading();
        }
    }

    setupEventListeners(): void {
        if (this.input) {
            this.input.addEventListener('input', this.debounce(this.handleSearchInput.bind(this), 300));
        }
    }

    async handleSearchInput(event: Event): Promise<void> {
        const target = event.target as HTMLInputElement;
        const query = target.value.trim();
        
        if (!query) return this.clearResults();

        try {
            if (!this.searchEngine) {
                throw new Error('Search engine not initialized');
            }

            const results = await this.searchEngine.search(query, { 
                fuzzy: true, 
                maxResults: 10,
                threshold: 0.2  // Add threshold for more relevant results
            });
            this.renderResults(results);

        } catch (error) {
            this.showError('Search failed. Please try again.');
            console.error('Search error:', error);
        }
    }

    renderResults(results: any[]): void {
        if (!this.resultsContainer || !this.noResults) return;

        this.resultsContainer.innerHTML = '';
        
        if (!results.length) {
            this.noResults.style.display = 'block';
            this.resultsContainer.style.display = 'none';
            return;
        }

        this.noResults.style.display = 'none';
        this.resultsContainer.style.display = 'block';

        results.forEach(result => {
            const { title, content, tags, comments, author, id } = result.item;
            const commentPreview = comments && comments.length
                ? `<div class="comments-preview"><strong>${comments.length} comments</strong><p>${comments[0].body.slice(0, 100)}...</p></div>`
                : '';

            const resultHTML = `
                <div class="search-result" data-id="${id}">
                    <h3>${this.highlightText(title, this.input?.value || '')}</h3>
                    <div class="meta">
                        <span class="author">By ${author}</span>
                        <span class="post-id">${id}</span>
                    </div>
                    <p>${this.highlightText(content, this.input?.value || '')}</p>
                    ${commentPreview}
                    <div class="tags">
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="score">Score: ${(result.score * 100).toFixed(0)}%</div>
                </div>
            `;
            this.resultsContainer.insertAdjacentHTML('beforeend', resultHTML);
        });
    }

    // Helper method to highlight search terms
    highlightText(text: string, searchTerm: string): string {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    clearResults(): void {
        if (this.resultsContainer) this.resultsContainer.innerHTML = '';
        if (this.noResults) this.noResults.style.display = 'none';
    }

    showLoading(): void {
        if (this.spinner) this.spinner.style.display = 'block';
        if (this.input) this.input.disabled = true;
    }

    hideLoading(): void {
        if (this.spinner) this.spinner.style.display = 'none';
        if (this.input) this.input.disabled = false;
    }

    showError(message: string): void {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    debounce(func: Function, delay: number): (...args: any[]) => void {
        let timeout: number;
        return (...args: any[]) => {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// Initialize search bar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.search-container');
    if (container) new NexusSearchBar(container as HTMLElement);
});