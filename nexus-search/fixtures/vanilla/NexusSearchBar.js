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

    async fetchPosts() {
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

            return posts.map(post => ({
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
                postId: post.id
            }));

        } catch (error) {
            throw new Error(`Failed to fetch posts: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    async initialize() {
        try {
            this.showLoading();

            if (!window.NexusSearch) throw new Error('NexusSearch library not loaded');

            this.searchEngine = new window.NexusSearch.SearchEngine({
                name: 'nexus-search-bar',
                version: 1,
                fields: ['title', 'content', 'tags', 'author']
            });

            await this.searchEngine.initialize();

            this.posts = await this.fetchPosts();
            await this.searchEngine.addDocuments(this.posts);

            this.setupEventListeners();

        } catch (error) {
            this.showError(`Initialization error: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    setupEventListeners() {
        this.input?.addEventListener('input', this.debounce(this.handleSearchInput.bind(this), 300));
    }

    async handleSearchInput(event) {
        const query = event.target.value.trim();
        if (!query) return this.clearResults();

        try {
            const results = await this.searchEngine.search(query, { fuzzy: true, maxResults: 10 });
            this.renderResults(results);

        } catch (error) {
            this.showError('Search failed. Please try again.');
        }
    }

    renderResults(results) {
        this.resultsContainer.innerHTML = '';
        if (!results.length) {
            this.noResults.style.display = 'block';
            this.resultsContainer.style.display = 'none';
            return;
        }

        this.noResults.style.display = 'none';
        this.resultsContainer.style.display = 'block';

        results.forEach(result => {
            const { title, content, tags, comments, author, postId } = result.item;
            const commentPreview = comments.length
                ? `<div class="comments-preview"><strong>${comments.length} comments</strong><p>${comments[0].body.slice(0, 100)}...</p></div>`
                : '';

            const resultHTML = `
                <div class="search-result">
                    <h3>${title}</h3>
                    <div class="meta">
                        <span class="author">By ${author}</span>
                        <span class="post-id">Post #${postId}</span>
                    </div>
                    <p>${content}</p>
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

    clearResults() {
        this.resultsContainer.innerHTML = '';
        this.noResults.style.display = 'none';
    }

    showLoading() {
        this.spinner.style.display = 'block';
        if (this.input) this.input.disabled = true;
    }

    hideLoading() {
        this.spinner.style.display = 'none';
        if (this.input) this.input.disabled = false;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    debounce(func, delay) {
        let timeout;
        return (...args) => {
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
