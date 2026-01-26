import store from '../store/store.js';
import { Utils } from '../utils/utils.js';
import { renderPagination } from './pagination.js';

// ==================== RENDER STARS ====================
export function renderStars(rating = 0, movieId = null) {
  const container = Utils.createElement('div', 'star-rating d-inline-block');
  if (movieId) container.setAttribute('data-movie-id', movieId);
  
  for (let i = 1; i <= 5; i++) {
    const star = Utils.createElement('span', 'star', i <= rating ? '★' : '☆', {
      'data-value': i
    });
    
    if (i <= rating) star.classList.add('text-warning');
    else star.classList.add('text-secondary');
    
    star.style.cursor = 'pointer';
    container.appendChild(star);
  }
  
  return container;
}

// ==================== MOVIE CARD ====================
export function createMovieCard(movie, userRating = null, showDeleteBtn = false) {
  const col = Utils.createElement('div', 'col'); 
  
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Poster';

  col.innerHTML = `
    <div class="card h-100 bg-black text-white border-secondary movie-card-hover position-relative shadow-sm" data-movie-id="${movie.id}" style="cursor: pointer; transition: transform 0.2s;">
      
      ${showDeleteBtn ? `
        <button 
          class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 remove-movie-btn rounded-circle d-flex align-items-center justify-content-center" 
          data-movie-id="${movie.id}" 
          style="z-index: 10; width: 24px; height: 24px; padding: 0;"
          title="Remove from watchlist"
        >
          ✕
        </button>
      ` : ''}

      <img src="${poster}" class="card-img-top" alt="${movie.title}" style="min-height: 250px; object-fit: cover;">
      
      <div class="card-body p-2 d-flex flex-column">
        <h6 class="card-title text-truncate small fw-bold mb-2" title="${movie.title}">${movie.title}</h6>
        <div class="d-flex justify-content-between align-items-center mt-auto">
           <small class="text-secondary">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</small>
           <span class="badge bg-warning text-dark border border-warning">★ ${movie.vote_average.toFixed(1)}</span>
        </div>
      </div>
    </div>
  `;
  
  return col;
}

// ==================== TRENDING MOVIES ====================
export function renderTrendingMovies(movies, userRatings = {}) {
  const ul = document.getElementById("trendingList");
  ul.innerHTML = "";
  
  movies.forEach(movie => {
    const userRating = userRatings[movie.id] || null;
    const card = createMovieCard(movie, userRating);
    ul.appendChild(card);
  });
}

// ==================== RENDER RESULTS WITH PAGINATION ====================
export function renderResultsWithPagination(resultsData, type, userRatings = {}) {
  let container, title;
  
  const movies = resultsData.results || []; 
  const totalResults = resultsData.total_results || 0;
  const page = resultsData.page || 1;
  const totalPages = resultsData.total_pages || 0;

  switch(type) {
    case 'search':
      container = document.getElementById("searchResults");
      title = document.getElementById("searchResultsTitle");
      if (title) title.textContent = `Search Results (${totalResults} movies)`;
      break;
    case 'genre':
      container = document.getElementById("genreResultsList");
      title = document.getElementById("genreResultsTitle");
      const genreName = store.pagination.currentGenreName || 'Genre';
      if (title) title.textContent = `${genreName} Movies (${totalResults} movies)`;
      break;
    case 'filtered':
      container = document.getElementById("filteredResultsList");
      title = document.getElementById("filteredResultsTitle");
      if (title) title.textContent = `Filtered Movies (${totalResults} movies)`;
      break;
    default:
      return;
  }
  
  if (!container) return;
  container.innerHTML = '';
  
  if (movies.length === 0) {
    container.innerHTML = '<div class="col-12"><p class="text-center text-muted fst-italic py-5">No movies found</p></div>';
    return;
  }
  
  movies.forEach(movie => {
    const userRating = userRatings[movie.id] || null;
    const card = createMovieCard(movie, userRating);
    container.appendChild(card);
  });
  
  // Eliminar paginaciones anteriores
  const oldPaginationId = `${container.id}-pagination`;
  let paginationContainer = document.getElementById(oldPaginationId);
  if (paginationContainer) paginationContainer.remove();
  
  // Solo crear paginación si hay más de una página
  if (totalPages > 1) {
    paginationContainer = Utils.createElement('div', 'pagination-wrapper d-flex justify-content-center mt-4 w-100');
    paginationContainer.id = oldPaginationId;
    
    const paginationControls = renderPagination(
      page, 
      totalPages, 
      (newPage) => window.handlePageChange(newPage)
    );
    
    if (paginationControls) {
      paginationContainer.appendChild(paginationControls);
      container.parentNode.insertBefore(paginationContainer, container.nextSibling);
    }
  }
}

// ==================== WRAPPERS FOR CONTROLLER CALLS ====================
export function renderSearchResults(results, userRatings = {}) {
  renderResultsWithPagination(results, 'search', userRatings);
}

export function renderMoviesByGenre(results, genreName, userRatings = {}) {
  renderResultsWithPagination(results, 'genre', userRatings);
}

export function renderFilteredMovies(results, filters, userRatings = {}) {
  renderResultsWithPagination(results, 'filtered', userRatings);
}

// ==================== MOVIE DETAIL ====================
export function renderMovieDetail(movie, userRating = null, averageRating = null, comments = []) {
  const container = document.getElementById("movieDetailContent");
  if (!container) return;
  
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "";
  
  container.innerHTML = `
    <div class="row">
      <div class="col-md-4 mb-4">
        ${poster ? `<img src="${poster}" class="img-fluid rounded shadow" alt="${movie.title}" />` : ""}
      </div>
      
      <div class="col-md-8">
        <h2 class="display-6 fw-bold mb-2">${movie.title} <span class="text-secondary fs-4">(${movie.release_date?.slice(0, 4) || ""})</span></h2>
        
        <div class="d-flex align-items-center gap-2 mb-4">
            <span class="badge bg-warning text-dark">TMDB: ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
            ${averageRating ? `<span class="badge bg-info text-dark">User Avg: ${averageRating}/5</span>` : ''}
        </div>
        
        <p class="lead fs-6 text-light opacity-75">${movie.overview || 'No description available.'}</p>
        
        <div class="card bg-secondary bg-opacity-10 border-secondary mt-4">
          <div class="card-body">
            <h5 class="card-title text-info fs-6 text-uppercase mb-3">Rate this movie</h5>
            <div class="d-flex align-items-center gap-3">
                <div class="star-rating fs-3" data-movie-id="${movie.id}">
                  ${renderStars(userRating ? userRating.score : 0, movie.id).innerHTML}
                </div>
                ${userRating ? `<span class="badge bg-success">Your rating: ${userRating.score}/5</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const commentsSection = renderCommentsSection(movie, comments);
  container.appendChild(commentsSection);
}

// ==================== COMMENTS SECTION ====================
export function renderCommentsSection(movie, comments) {
  const container = Utils.createElement('div', 'comments-section mt-5 pt-4 border-top border-secondary');
  container.appendChild(Utils.createElement('h3', 'h4 mb-4 text-white', 'Comments'));
  
   if (store.currentUser) {
    const form = Utils.createElement('div', 'comment-form mb-4');
    form.innerHTML = `
      <div class="mb-3">
        <textarea id="commentText" class="form-control bg-dark text-white border-secondary" placeholder="Write your comment here..." rows="3"></textarea>
      </div>
      <div class="text-end">
        <button id="submitCommentBtn" class="btn btn-primary px-4" data-movie-id="${movie.id}">Post Comment</button>
      </div>
    `;
    container.appendChild(form);
  } else {
    container.appendChild(Utils.createElement('div', 'alert alert-secondary', 'Log in to post comments'));
  }
  
  const commentsList = Utils.createElement('div', 'list-group list-group-flush');
  commentsList.id = "commentsList";
  
  if (comments.length === 0) {
    commentsList.innerHTML = '<div class="list-group-item bg-transparent text-muted fst-italic border-0 ps-0">No comments yet. Be the first to comment!</div>';
  } else {
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    comments.forEach(comment => {
      const commentDiv = Utils.createElement('div', 'list-group-item bg-transparent border-secondary text-white px-0 py-3');
      commentDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <strong class="text-info">${comment.username || "Anonymous"}</strong>
            <small class="text-secondary ms-2">${Utils.formatDate(comment.createdAt)}</small>
          </div>
          ${store.currentUser && comment.userId === store.currentUser.id ? 
            `<button class="btn btn-outline-danger btn-sm py-0 px-2 delete-comment-btn" data-comment-id="${comment.id}" style="font-size: 0.75rem;">Delete</button>` : ''}
        </div>
        <p class="mb-0 opacity-75">${comment.text}</p>
      `;
      commentsList.appendChild(commentDiv);
    });
  }
  container.appendChild(commentsList);
  return container;
}

// ==================== WATCHLISTS ====================
// En la función renderWatchlists, puedes eliminar el parámetro 'type' si ya no lo necesitas
// o mantenerlo pero no usarlo para el título
export function renderWatchlists(watchlists, type = "public") {
  const containers = [
    document.getElementById("watchlistsList"),
    document.getElementById("mobileWatchlistsContainer")
  ];

  // Determine title text based on store or type, defaulting to Public
  const isMyWatchlist = type === "my" || store.currentView === "my";
  const titleText = isMyWatchlist ? "Your Watchlists" : "Public Watchlists";

  containers.forEach(container => {
    if (!container) return;
    container.innerHTML = "";
    
    // Add title for mobile container
    if (container.id === "mobileWatchlistsContainer") {
       const title = Utils.createElement('h5', 'text-white mb-3', titleText);
       container.appendChild(title);
    }
    
    if (watchlists.length === 0) {
        const msg = Utils.createElement('div', 'text-muted small fst-italic', 'No watchlists found.');
        container.appendChild(msg);
        return;
    }
    
    watchlists.forEach(wl => {
      const div = Utils.createElement('button', `list-group-item list-group-item-action bg-transparent text-white border-secondary mb-2 rounded d-flex justify-content-between align-items-center watchlist-item ${wl.isPublic ? "border-start border-success border-4" : "border-start border-danger border-4"}`);
      div.setAttribute('data-watchlist-id', wl.id);
      
      div.innerHTML = `
        <div class="text-truncate fw-medium" title="${wl.name}">${wl.name}</div>
        <span class="badge ${wl.isPublic ? "bg-success" : "bg-danger"} rounded-pill" style="font-size: 0.65rem;">${wl.isPublic ? "Public" : "Private"}</span>
      `;
      container.appendChild(div);
    });
  });
}

// ==================== WATCHLIST DETAIL ====================
export function renderWatchlistView(watchlist, movies, userRatings = {}) {
  const container = document.getElementById("watchlistDetail");
  if (!container) return;
  
  container.innerHTML = "";
  container.style.display = "block";
  container.classList.add("open");
  
  const isOwner = store.currentUser?.id === watchlist.userId;
  
  // Crear un ID único para esta watchlist
  const watchlistEditId = `watchlist-edit-${watchlist.id}`;
  
  // Verificar si esta watchlist específica está en modo edición
  const isEditing = sessionStorage.getItem(watchlistEditId) === 'true';
  
  // Crear header con modo de edición
  const header = Utils.createElement('div', 'watchlist-header mb-4 border-bottom border-secondary pb-3');
  
  if (isOwner && isEditing) {
    // Modo edición (solo para el propietario)
    header.innerHTML = `
      <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
        <div class="d-flex flex-column flex-grow-1">
          <div class="d-flex align-items-center gap-2 mb-2">
            <input type="text" id="renameWatchlistInput" class="form-control bg-dark text-white border-secondary" 
                   value="${watchlist.name}" placeholder="Watchlist name" style="max-width: 400px;">
            <button class="btn btn-sm btn-success save-rename-btn">Save</button>
            <button class="btn btn-sm btn-outline-secondary cancel-rename-btn">Cancel</button>
          </div>
          <span class="badge ${watchlist.isPublic ? "bg-success" : "bg-danger"} align-self-start">${watchlist.isPublic ? "Public" : "Private"}</span>
        </div>
        <div class="d-flex gap-2 mt-2 mt-md-0">
          <button class="btn btn-sm btn-outline-secondary privacy-toggle-btn">Toggle Privacy</button>
          <button class="btn btn-sm btn-outline-danger delete-watchlist-btn">Delete</button>
          <button class="btn btn-sm btn-close btn-close-white close-watchlist-btn ms-2"></button>
        </div>
      </div>
    `;
  } else {
    // Modo visualización (para todos o para propietario no editando)
    header.innerHTML = `
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div class="d-flex align-items-center gap-3">
          <h3 class="m-0 watchlist-name-display">${watchlist.name}</h3>
          <span class="badge ${watchlist.isPublic ? "bg-success" : "bg-danger"}">${watchlist.isPublic ? "Public" : "Private"}</span>
          ${isOwner ? `<button class="btn btn-sm btn-outline-light rename-watchlist-btn">Edit Name</button>` : ''}
        </div>
        <div class="d-flex gap-2 mt-2 mt-md-0">
          ${isOwner ? `
            <button class="btn btn-sm btn-outline-secondary privacy-toggle-btn">Toggle Privacy</button>
            <button class="btn btn-sm btn-outline-danger delete-watchlist-btn">Delete</button>
          ` : ''}
          <button class="btn btn-sm btn-close btn-close-white close-watchlist-btn ms-2"></button>
        </div>
      </div>
    `;
  }
  
  container.appendChild(header);
  
  // Información de películas
  const movieCount = Utils.createElement('p', 'text-muted mb-3', 
    `${movies.length} ${movies.length === 1 ? 'movie' : 'movies'} in this watchlist`);
  container.appendChild(movieCount);
  
  if (!movies.length) {
    container.appendChild(Utils.createElement('div', 'alert alert-secondary', 'No movies in this watchlist'));
    return;
  }
  
  const row = Utils.createElement('div', 'row row-cols-2 row-cols-md-4 row-cols-lg-5 g-3 watchlist-movies');
  
  movies.forEach(movie => {
    const userRating = userRatings[movie.id] || null;
    const card = createWatchlistMovieCard(movie, userRating, isOwner);
    row.appendChild(card);
  });
  
  container.appendChild(row);
  
  // Asegurar que los estrellas se rendericen correctamente
  setTimeout(() => {
    movies.forEach(movie => {
      const userRating = userRatings[movie.id];
      const ratingValue = userRating ? userRating.score : 0;
      
      const starContainer = document.querySelector(`.watchlist-movie[data-movie-id="${movie.id}"] .star-rating`);
      if (starContainer) {
        const stars = renderStars(ratingValue, movie.id);
        starContainer.innerHTML = stars.innerHTML;
      }
    });
  }, 100);
}

export function createWatchlistMovieCard(movie, userRating = null, isOwner = false) {
  return createMovieCard(movie, userRating, isOwner);
}

// ==================== ADD TO WATCHLIST ====================
export function renderAddToWatchlist(movie, watchlists) {
  const container = Utils.createElement('div', 'list-group mt-3 add-to-watchlist');
  
  if (watchlists.length === 0) {
    container.innerHTML = '<div class="alert alert-warning">No watchlists yet. Create one first!</div>';
    return container;
  }
  
  watchlists.forEach(wl => {
    const btn = Utils.createElement('button', 'list-group-item list-group-item-action d-flex justify-content-between align-items-center bg-dark text-white border-secondary', `<span>${wl.name}</span> <span class="badge bg-primary">Add</span>`, {
      'data-watchlist-id': wl.id,
      'data-movie-id': movie.id
    });
    container.appendChild(btn);
  });
  
  return container;
}

// ==================== GENRES DROPDOWN ====================
export function renderGenresDropdown(genres) {
  const dropdown = document.getElementById("genresDropdown");
  if (!dropdown) return;
  
  dropdown.innerHTML = "";
  dropdown.className = "dropdown-menu show bg-dark border-secondary shadow p-2";
  dropdown.style.display = "block";
  dropdown.style.maxHeight = "300px";
  dropdown.style.overflowY = "auto";
  
  genres.forEach(genre => {
    const genreItem = Utils.createElement('button', 'dropdown-item text-light genre-item', genre.name, {
      'data-genre-id': genre.id,
      'data-genre-name': genre.name
    });
    genreItem.onmouseover = () => genreItem.classList.add('bg-secondary');
    genreItem.onmouseout = () => genreItem.classList.remove('bg-secondary');
    dropdown.appendChild(genreItem);
  });
}

// ==================== UPDATE BACK BUTTON ====================
export function updateBackButton() {
  const btn = document.getElementById("backToHomeBtn");
  if (!btn) return;
  
  btn.className = "btn btn-outline-secondary mb-3";
  
  if (store.currentWatchlist) {
    btn.textContent = "← Back to Watchlist";
  } else if (store.previousView === "search") {
    btn.textContent = "← Back to Search";
  } else if (store.previousView === "genre") {
    btn.textContent = "← Back to Genre";
  } else if (store.previousView === "filtered") {
    btn.textContent = "← Back to Filters";
  } else {
    btn.textContent = "← Back to Home";
  }
}

// ==================== UI STATES ====================
export function showView(viewName, options = {}) {
    const sidebar = document.getElementById("sidebar");
    const searchBox = document.getElementById("searchBox");
    const trendingTitle = document.getElementById("trendingTitle");
    const trendingList = document.getElementById("trendingList");
    const searchResultsTitle = document.getElementById("searchResultsTitle");
    const searchResults = document.getElementById("searchResults");
    const genreResultsTitle = document.getElementById("genreResultsTitle");
    const genreResultsList = document.getElementById("genreResultsList");
    const filteredResultsTitle = document.getElementById("filteredResultsTitle");
    const filteredResultsList = document.getElementById("filteredResultsList");
    const showTrendingBtn = document.getElementById("showTrendingBtn");
    const showExploreBtn = document.getElementById("showExploreBtn");
    
    // Hide all content areas
    [trendingTitle, trendingList, searchResultsTitle, searchResults, 
     genreResultsTitle, genreResultsList, filteredResultsTitle, filteredResultsList].forEach(el => {
        if(el) el.style.display = 'none';
    });
    
    // Hide navigation buttons
    if (showTrendingBtn) showTrendingBtn.style.display = 'none';
    if (showExploreBtn) showExploreBtn.style.display = 'none';
    
    // Clear all pagination containers to prevent accumulation
    document.querySelectorAll('.pagination-wrapper').forEach(wrapper => {
        wrapper.remove();
    });

    switch(viewName) {
        case 'trending':
            if(sidebar) sidebar.style.display = 'block';
            if(searchBox) searchBox.style.display = 'flex';
            if(trendingTitle) trendingTitle.style.display = 'block';
            if(trendingList) trendingList.style.display = 'flex';
            break;
        case 'search':
            if(sidebar) sidebar.style.display = 'block';
            if(searchBox) searchBox.style.display = 'flex';
            if(searchResultsTitle) searchResultsTitle.style.display = 'block';
            if(searchResults) searchResults.style.display = 'flex';
            if(showTrendingBtn) showTrendingBtn.style.display = 'inline-block';
            break;
        case 'genre':
            if(sidebar) sidebar.style.display = 'block';
            if(searchBox) searchBox.style.display = 'flex';
            if(genreResultsTitle) genreResultsTitle.style.display = 'block';
            if(genreResultsList) genreResultsList.style.display = 'flex';
            if(showTrendingBtn) showTrendingBtn.style.display = 'inline-block';
            break;
        case 'filtered':
            if(sidebar) sidebar.style.display = 'block';
            if(searchBox) searchBox.style.display = 'flex';
            if(filteredResultsTitle) filteredResultsTitle.style.display = 'block';
            if(filteredResultsList) filteredResultsList.style.display = 'flex';
            if(showTrendingBtn) showTrendingBtn.style.display = 'inline-block';
            break;
        case 'watchlist':
            if(sidebar) sidebar.style.display = 'block';
            if(searchBox) searchBox.style.display = 'flex';
            if(showExploreBtn) showExploreBtn.style.display = 'inline-block';
            break;
        case 'movie':
            // Logic handled by Utils.navigate
            break;
    }
}