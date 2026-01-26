// store/store.js
const store = {
  currentUser: null,
  currentView: "login",
  currentMovie: null,
  currentWatchlist: null,
  previousView: null,
  previousViewData: null,
  navigationHistory: [],
  
  // NUEVO: Estado de paginación
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    pageSize: 20,
    currentType: null, // 'search', 'genre', 'filtered'
    currentQuery: null,
    currentGenreId: null,
    currentGenreName: null,
    currentFilters: null
  },
  
  resetContext() {
    this.currentWatchlist = null;
    this.previousView = null;
    this.previousViewData = null;
    
    // Limpiar cualquier estado de edición de watchlists
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('watchlist-edit-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    this.resetPagination();
  },
  
  resetPagination() {
    this.pagination = {
      currentPage: 1,
      totalPages: 0,
      totalResults: 0,
      pageSize: 20,
      currentType: null,
      currentQuery: null,
      currentGenreId: null,
      currentGenreName: null,
      currentFilters: null
    };
  },
  
  pushToHistory(view, data = null) {
    this.navigationHistory.push({ view, data, timestamp: Date.now() });
    if (this.navigationHistory.length > 10) {
      this.navigationHistory.shift();
    }
  },
  
  getPreviousView() {
    if (this.navigationHistory.length < 2) return null;
    return this.navigationHistory[this.navigationHistory.length - 2];
  }
};

export default store;