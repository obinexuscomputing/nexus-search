<template>
  <div class="nexus-search-bar">
    <div class="search-container">
      <div class="relative">
        <input
          type="text"
          v-model="query"
          @input="handleInputChange"
          placeholder="Search..."
          class="search-input"
          :disabled="isLoading && !query"
        />
        <div v-if="isLoading" class="loading-spinner"></div>
      </div>

      <div v-if="error" class="error-message" role="alert">
        {{ error }}
      </div>

      <div v-if="results.length > 0" class="search-results">
        <div v-for="(result, index) in results" :key="index" class="search-result">
          <h3>{{ result.item.title }}</h3>
          <p>{{ result.item.content }}</p>
          <div class="tags">
            <span v-for="(tag, tagIndex) in result.item.tags" :key="tagIndex" class="tag">
              {{ tag }}
            </span>
          </div>
          <div class="score">
            Score: {{ (result.score * 100).toFixed(0) }}%
          </div>
        </div>
      </div>

      <div v-if="query && !isLoading && results.length === 0" class="no-results">
        No results found for "{{ query }}"
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { SearchEngine } from '@obinexuscomputing/nexus-search';

const query = ref('');
const results = ref([]);
const isLoading = ref(false);
const error = ref(null);
const searchEngine = ref(null);
let searchTimeout = null;

onMounted(async () => {
  try {
    isLoading.value = true;
    searchEngine.value = new SearchEngine({
      name: 'nexus-search-bar',
      version: 1,
      fields: ['title', 'content', 'tags'],
    });
    
    await searchEngine.value.initialize();
    
    await searchEngine.value.addDocuments([
      {
        title: 'Getting Started',
        content: 'Quick start guide for NexusSearch',
        tags: ['guide', 'documentation'],
      },
      {
        title: 'Advanced Features',
        content: 'Explore advanced search capabilities',
        tags: ['advanced', 'features'],
      },
      {
        title: 'Search Optimization',
        content: 'Learn about fuzzy search and performance tuning',
        tags: ['performance', 'optimization'],
      }
    ]);
    
    error.value = null;
  } catch (err) {
    error.value = 'Failed to initialize search engine';
    console.error('Initialization error:', err);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

const handleSearch = async (searchQuery) => {
  if (!searchEngine.value) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    const searchResults = await searchEngine.value.search(searchQuery, {
      fuzzy: true,
      maxResults: 5,
    });
    results.value = searchResults;
  } catch (err) {
    error.value = 'Search failed. Please try again.';
    console.error('Search error:', err);
    results.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleInputChange = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    if (query.value.trim()) {
      handleSearch(query.value);
    } else {
      results.value = [];
    }
  }, 300);
};
</script>

<style scoped>
.nexus-search-bar {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.relative {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
  background-color: white;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.loading-spinner {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  padding: 0.75rem;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
}

.search-results {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-result {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
}

.search-result:last-child {
  border-bottom: none;
}

.search-result:hover {
  background-color: #f8fafc;
}

.search-result h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.search-result p {
  margin: 0.5rem 0;
  color: #64748b;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  background-color: #dbeafe;
  color: #1d4ed8;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.score {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}
</style>