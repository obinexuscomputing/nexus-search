import { FileUploader } from './FileUploader.js';

class NexusSearchBar {
    constructor(container) {
        this.container = container;
        this.searchEngine = null;
        this.searchTimeout = null;
        this.documents = [];

        // Cache DOM elements
        this.input = container.querySelector('.search-input');
        this.spinner = container.querySelector('.loading-spinner');
        this.errorMessage = container.querySelector('.error-message');
        this.resultsContainer = container.querySelector('.search-results');
        this.noResults = container.querySelector('.no-results');
        this.fileInput = container.querySelector('.file-input');

        this.initialize();
    }

    async loadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const fileType = this.getFileType(file.name);

                    const documentData = {
                        id: `doc-${Date.now()}-${file.name}`,
                        title: file.name,
                        content: content,
                        type: fileType,
                        author: 'Unknown',
                        fields: {
                            title: file.name,
                            content: content,
                            type: fileType,
                            author: 'Unknown'
                        }
                    };

                    resolve(documentData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;

            // Read file based on its type
            if (this.isTextBasedFile(file.name)) {
                reader.readAsText(file);
            } else {
                reject(new Error('Unsupported file type'));
            }
        });
    }

    getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'md':
                return 'text/markdown';
            case 'html':
                return 'text/html';
            case 'txt':
                return 'text/plain';
            default:
                return 'application/octet-stream';
        }
    }

    isTextBasedFile(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        return ['md', 'html', 'txt'].includes(extension);
    }

    capitalizeFirstLetter(string) {
        return string && typeof string === 'string'
            ? string.charAt(0).toUpperCase() + string.slice(1)
            : '';
    }

    async fetchDocuments() {
        try {
            this.showLoading();

            // Get files from file input
            const fileInput = this.container.querySelector('.file-input');
            const files = fileInput.files;

            if (!files || files.length === 0) {
                throw new Error('No files selected');
            }

            // Load all valid files
            const documentPromises = Array.from(files)
                .filter(file => this.isTextBasedFile(file.name))
                .map(file => this.loadFile(file));

            this.documents = await Promise.all(documentPromises);

            return this.documents;
        } catch (error) {
            console.error('Fetch documents error:', error);
            throw new Error(`Failed to fetch documents: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async initialize() {
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
                fields: ['title', 'content', 'type', 'author'],
                storage: { type: 'memory' }
            });

            await this.searchEngine.initialize();

            // Add file input change event listener
            if (this.fileInput) {
                this.fileInput.addEventListener('change', async () => {
                    try {
                        const documents = await this.fetchDocuments();

                        // Validate and normalize documents before adding
                        const validDocuments = documents.filter(doc =>
                            doc.id &&
                            (doc.title || doc.content) &&
                            typeof doc.id === 'string'
                        );

                        if (validDocuments.length === 0) {
                            throw new Error('No valid documents to add to search index');
                        }

                        // Normalize documents
                        const normalizedDocs = validDocuments.map(doc => ({
                            ...doc,
                            fields: {
                                title: doc.title || '',
                                content: doc.content || '',
                                type: doc.type || 'text',
                                author: doc.author || 'Unknown'
                            }
                        }));

                        await this.searchEngine.addDocuments(normalizedDocs);
                        console.log('Documents added to search index');
                    } catch (error) {
                        console.error('Error processing files:', error);
                        this.showError(`File processing error: ${error.message}`);
                    }
                });
            }

            this.setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError(`Initialization error: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    setupEventListeners() {
        if (this.input) {
            this.input.addEventListener('input', this.debounce(this.handleSearchInput.bind(this), 300));
        }
    }

    async handleSearchInput(event) {
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
                fields: ['title', 'content', 'type']
            });
            this.renderResults(results);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    renderResults(results) {
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
            try {
                const { title, content, type, author, id } = result.item;

                // Ensure content is a string
                const contentStr = content ? String(content) : '';
                const titleStr = title ? String(title) : '';
                const typeStr = type ? String(type) : 'Unknown';
                const authorStr = author ? String(author) : 'Unknown';

                const displayContent = contentStr.length > 200
                    ? contentStr.slice(0, 200) + '...'
                    : contentStr;

                const resultHTML = `
                    <div class="search-result" data-id="${id}">
                        <h3>${this.highlightText(titleStr, this.input.value || '')}</h3>
                        <div class="meta">
                            <span class="author">By ${authorStr}</span>
                            <span class="type">Type: ${typeStr}</span>
                        </div>
                        <p>${this.highlightText(displayContent, this.input.value || '')}</p>
                        <div class="score">Score: ${(result.score * 100).toFixed(0)}%</div>
                    </div>
                `;
                this.resultsContainer.insertAdjacentHTML('beforeend', resultHTML);
            } catch (error) {
                console.error('Error rendering result:', error, result);
            }
        });
    }

    highlightText(text, searchTerm) {
        // Ensure both text and searchTerm are strings
        if (!searchTerm || !text) return text;

        try {
            // Convert to string and escape special regex characters
            const safeText = String(text);
            const safeSearchTerm = String(searchTerm)
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const regex = new RegExp(`(${safeSearchTerm})`, 'gi');
            return safeText.replace(regex, '<span class="highlight">$1</span>');
        } catch (error) {
            console.error('Highlight error:', error);
            return text;
        }
    }

    clearResults() {
        if (this.resultsContainer) this.resultsContainer.innerHTML = '';
        if (this.noResults) this.noResults.style.display = 'none';
    }

    showLoading() {
        if (this.spinner) this.spinner.style.display = 'block';
        if (this.input) this.input.disabled = true;
    }

    hideLoading() {
        if (this.spinner) this.spinner.style.display = 'none';
        if (this.input) this.input.disabled = false;
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// Usage in browser
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.search-container');
    if (container) new NexusSearchBar(container);

    const fileInputElement = document.querySelector('#fileInput');
    // File upload
    if (fileInputElement) {
        const uploader = new FileUploader();
        fileInputElement.addEventListener('change', async (e) => {
            try {
                const files = e.target.files;
                const result = await uploader.uploadFiles(files);
                console.log('Files uploaded:', result);
            } catch (error) {
                console.error('Upload failed', error);
            }
        });
    }

    // Search
    const searchInput = document.querySelector('#searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                try {
                    const results = await uploader.searchFiles(query);
                    displaySearchResults(results);
                } catch (error) {
                    console.error('Search failed', error);
                }
            }
        });
    }
});

function displaySearchResults(results) {
    const searchResults = document.querySelector('#searchResults');
    if (searchResults) {
        searchResults.innerHTML = '';
        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.textContent = result.title;
            searchResults.appendChild(resultElement);
        });
    }
}
