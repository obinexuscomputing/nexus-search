class NexusSearchBar {
    constructor(container) {
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

    async fetchPosts() { // returns Promise<Array<Object>>
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

            const commentsByPost = comments.reduce((acc, comment) => {
                if (!acc[comment.postId]) acc[comment.postId] = [];
                acc[comment.postId].push(comment);
                return acc;
            }, {});

            return posts.map(post => {
                // Normalize document to ensure all required fields exist
                return {
                    id: `post-${post.id}`,
                    title: this.capitalizeFirstLetter(post.title || ''),
                    content: this.capitalizeFirstLetter(post.body || ''),
                    body: this.capitalizeFirstLetter(post.body || ''), // Add body for compatibility
                    fields: {
                        title: this.capitalizeFirstLetter(post.title || ''),
                        content: this.capitalizeFirstLetter(post.body || ''),
                        body: this.capitalizeFirstLetter(post.body || '')
                    },
                    tags: [
                        'blog',
                        `user-${post.userId}`,
                        `post-${post.id}`,
                        ...(commentsByPost[post.id] ? ['has-comments'] : [])
                    ],
                    comments: commentsByPost[post.id] || [],
                    author: `User ${post.userId}`,
                    type: 'post'
                };
            });

        } catch (error) {
            console.error('Fetch posts error:', error);
            throw new Error(`Failed to fetch posts: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    capitalizeFirstLetter(string) { // returns string
        return string && typeof string === 'string' 
            ? string.charAt(0).toUpperCase() + string.slice(1) 
            : '';
    }

    async initialize() { // returns Promise<void>
        try {
            this.showLoading();

            // More robust check for NexusSearch library
            if (typeof window === 'undefined' || 
                !window.NexusSearch || 
                !window.NexusSearch.SearchEngine) {
                throw new Error('NexusSearch library not loaded or incomplete');
            }

            // Initialize search engine with robust configuration
            this.searchEngine = new window.NexusSearch.SearchEngine({
                name: 'nexus-search-bar',
                version: 1,
                fields: ['title', 'content', 'body', 'tags', 'author', 'type'],
                storage: { type: 'memory' }
            });

            await this.searchEngine.initialize();

            // Fetch and add posts with error handling
            this.posts = await this.fetchPosts();
            
            // Validate and normalize documents before adding
            const validDocuments = this.posts.filter(doc => 
                doc.id && 
                (doc.title || doc.content) && 
                typeof doc.id === 'string'
            );

            if (validDocuments.length === 0) {
                throw new Error('No valid documents to add to search index');
            }

            // Ensure each document has a 'fields' property with required fields
            const normalizedDocs = validDocuments.map(doc => ({
                ...doc,
                fields: {
                    title: doc.title || '',
                    content: doc.content || doc.body || '',
                    body: doc.body || '',
                    tags: doc.tags || [],
                    author: doc.author || '',
                    type: doc.type || 'post'
                }
            }));

            await this.searchEngine.addDocuments(normalizedDocs);

            this.setupEventListeners();

        } catch (error) {
            console.error('Initialization error:', error);
            this.showError(`Initialization error: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    setupEventListeners() { // returns void
        if (this.input) {
            this.input.addEventListener('input', this.debounce(this.handleSearchInput.bind(this), 300));
        }
    }

    async handleSearchInput(event) { // returns Promise<void>
        const query = event.target.value.trim();
        
        if (!query) return this.clearResults();

        try {
            if (!this.searchEngine) {
                throw new Error('Search engine not initialized');
            }

            const results = await this.searchEngine.search(query, { 
                fuzzy: true, 
                maxResults: 10,
                threshold: 0.2,
                fields: ['title', 'content', 'body', 'tags']
            });
            this.renderResults(results);

        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    renderResults(results) { // returns void
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
            const { title, content, body, tags, comments, author, id } = result.item;
            const displayContent = content || body || '';
            const commentPreview = comments && comments.length
                ? `<div class="comments-preview"><strong>${comments.length} comments</strong><p>${comments[0].body.slice(0, 100)}...</p></div>`
                : '';

            const resultHTML = `
                <div class="search-result" data-id="${id}">
                    <h3>${this.highlightText(title, this.input.value || '')}</h3>
                    <div class="meta">
                        <span class="author">By ${author}</span>
                        <span class="post-id">${id}</span>
                    </div>
                    <p>${this.highlightText(displayContent, this.input.value || '')}</p>
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
    highlightText(text, searchTerm) { // returns string
        if (!searchTerm || !text) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    clearResults() { // returns void
        if (this.resultsContainer) this.resultsContainer.innerHTML = '';
        if (this.noResults) this.noResults.style.display = 'none';
    }

    showLoading() { // returns void
        if (this.spinner) this.spinner.style.display = 'block';
        if (this.input) this.input.disabled = true;
    }

    hideLoading() { // returns void
        if (this.spinner) this.spinner.style.display = 'none';
        if (this.input) this.input.disabled = false;
    }

    showError(message) { // returns void
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    debounce(func, delay) { // returns Function
        let timeout;
        return (...args) => { // returns void
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// Initialize search bar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.search-container');
    if (container) new NexusSearchBar(container);
});