// controller/controller.js
import * as Model from '../model/model.js';
import * as View from '../view/view.js';
import store from '../store/store.js';
import { Utils } from '../utils/utils.js';

// ==================== GLOBAL EVENTS ====================
export function setupGlobalEventListeners() {
  document.addEventListener('click', async (e) => {
    const removeBtn = e.target.closest('.remove-movie-btn'); // Detecta el botón o cualquier cosa dentro de él

    if (removeBtn) {
      e.preventDefault();
      e.stopPropagation(); // Evita que se abra el detalle de la película
      
      const movieId = removeBtn.getAttribute('data-movie-id');
      
      // Confirmación opcional (si quieres)
      if (movieId && store.currentWatchlist) {
            await handleRemoveMovieFromWatchlist(movieId);
      }
      return;
    }

    if (e.target.classList.contains('delete-comment-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const commentId = e.target.getAttribute('data-comment-id');
      if (commentId) {
        await handleDeleteComment(commentId);
      }
      return;
    }
    
    if (e.target.classList.contains('close-watchlist-btn')) {
      e.preventDefault();
      e.stopPropagation();
      handleCloseWatchlist();
      return;
    }
    
    if (e.target.classList.contains('rename-watchlist-btn')) {
      e.preventDefault();
      e.stopPropagation();
      handleRenameWatchlist();
      return;
    }
    
    if (e.target.classList.contains('privacy-toggle-btn')) {
      e.preventDefault();
      e.stopPropagation();
      await handleToggleWatchlistPrivacy();
      return;
    }
    
    if (e.target.classList.contains('delete-watchlist-btn')) {
      e.preventDefault();
      e.stopPropagation();
      await handleDeleteWatchlist();
      return;
    }
    
    if (e.target.closest('.add-to-watchlist button')) {
      e.preventDefault();
      e.stopPropagation();
      const btn = e.target.closest('.add-to-watchlist button');
      const watchlistId = btn.getAttribute('data-watchlist-id');
      const movieId = btn.getAttribute('data-movie-id');
      
      if (watchlistId && movieId) {
        const movie = await Model.getMovieDetails(movieId);
        await handleAddMovieToWatchlist(watchlistId, movie);
      }
      return;
    }
    
    if (e.target.id === 'submitCommentBtn') {
      e.preventDefault();
      e.stopPropagation();
      const movieId = e.target.getAttribute('data-movie-id');
      const textarea = document.getElementById('commentText');
      if (movieId && textarea && textarea.value.trim()) {
        await handleAddComment(movieId, textarea.value.trim());
        textarea.value = '';
      }
      return;
    }
    
    if (e.target.classList.contains('save-rename-btn')) {
      e.preventDefault();
      e.stopPropagation();
      await handleSaveRenameWatchlist();
      return;
    }
    
    if (e.target.classList.contains('cancel-rename-btn')) {
      e.preventDefault();
      e.stopPropagation();
      handleCancelRenameWatchlist();
      return;
    }
  });
    document.addEventListener('keypress', async (e) => {
    if (e.target.id === 'renameWatchlistInput' && e.key === 'Enter') {
      e.preventDefault();
      await handleSaveRenameWatchlist();
    }
  });

  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('star')) {
      const star = e.target;
      const starsContainer = star.closest('.star-rating');
      if (!starsContainer) return;
      
      const movieId = starsContainer.getAttribute('data-movie-id');
      const rating = parseInt(star.getAttribute('data-value'));
      
      if (movieId && rating) {
        await handleRateMovie(movieId, rating);
      }
    }
    
const card = e.target.closest('[data-movie-id]');
    
    // Verificamos:
    // 1. Que encontramos la tarjeta (card)
    // 2. Que NO dimos clic en un botón (para que no abra la peli al dar "Eliminar")
    // 3. Que NO dimos clic en una estrella (para que no abra la peli al puntuar)
    if (card && !e.target.closest('button') && !e.target.closest('.star')) {
       
       const movieId = card.getAttribute('data-movie-id');
       
       if (movieId) {
         // Llama a tu función original para abrir el detalle
         await handleMovieClick(movieId); 
       }
    }
    
    if (e.target.closest('.watchlist-item')) {
      const item = e.target.closest('.watchlist-item');
      const watchlistId = item.getAttribute('data-watchlist-id');
      if (watchlistId) {
        await handleViewWatchlist(watchlistId);
      }
    }
    
    if (e.target.classList.contains('genre-item')) {
      const genreId = e.target.getAttribute('data-genre-id');
      const genreName = e.target.getAttribute('data-genre-name');
      if (genreId && genreName) {
        await handleGenreClick(genreId, genreName);
      }
    }
    
    const dropdown = document.getElementById('genresDropdown');
    const genresBtn = document.getElementById('showGenresBtn');
    if (dropdown && dropdown.style.display === 'block' && 
        !dropdown.contains(e.target) && 
        e.target !== genresBtn && 
        !genresBtn.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }
}

// ==================== AUTH ====================
export async function handleLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  
  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }
  
  const user = await Model.login(username, password);
  if (!user) {
    alert("Invalid credentials");
    return;
  }
  
  store.currentUser = user;
  
  // Mostrar mensaje de bienvenida
  const welcomeElement = document.getElementById("welcomeUser");
  if (welcomeElement) {
    welcomeElement.textContent = `Welcome, ${user.username}!`;
  }
  
  await loadHome();
}

export async function handleRegister() {
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  
  const user = await Model.register(username, password);
  if (!user) {
    alert("User already exists");
    return;
  }
  
  store.currentUser = user;
  await loadHome();
}

// En controller.js - actualiza logout
function logout() {
  store.currentUser = null;
  store.resetContext();
  
  // Limpiar localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  
  Utils.navigate("login");
}

// ==================== HOME ====================
// En la función loadHome:
export async function loadHome() {
  Utils.navigate("home");
  store.resetContext();
  store.navigationHistory = [];
  store.pushToHistory("home");
  store.previousView = "trending";
  store.resetPagination();

  // Limpiar contenedores de resultados y paginaciones
  const containers = ["searchResults", "genreResultsList", "filteredResultsList"];
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) container.innerHTML = '';
  });
  
  // Eliminar todas las paginaciones
  document.querySelectorAll('.pagination-wrapper').forEach(wrapper => {
    wrapper.remove();
  });

  document.getElementById("logoutBtn").onclick = logout;
  document.getElementById("showCreateWatchlistBtn").onclick = showCreateWatchlistModal;
  document.getElementById("showMyWatchlistsBtn").onclick = loadMyWatchlists;
  document.getElementById("showPublicWatchlistsBtn").onclick = loadPublicWatchlists;
  document.getElementById("searchBtn").onclick = handleSearch;
  document.getElementById("showTrendingBtn").onclick = showTrending;
  document.getElementById("showExploreBtn").onclick = loadHome;
  document.getElementById("showFiltersBtn").onclick = showFiltersModal;
  document.getElementById("showGenresBtn").onclick = showGenresDropdown;
  
  // Actualizar título del sidebar a "Public Watchlists" por defecto
  const watchlistTitle = document.getElementById("watchlistTitle");
  if (watchlistTitle) {
    watchlistTitle.textContent = "Public Watchlists";
  }
  
  View.showView('trending');
  
  const movies = await Model.getTrendingMovies();
  
  const userRatings = {};
  if (store.currentUser) {
    for (const movie of movies) {
      const rating = await Model.getUserRatingForTMDBMovie(movie.id);
      if (rating) userRatings[movie.id] = rating;
    }
  }
  
  View.renderTrendingMovies(movies, userRatings);
  await loadPublicWatchlists();
}

// ==================== WATCHLISTS ====================
async function showCreateWatchlistModal() {
  Utils.showModal('createWatchlistModal', 'modalOverlay');
  
  document.getElementById("watchlistName").value = "";
  document.getElementById("isPublicCheckbox").checked = true;
  
  document.getElementById("saveWatchlistBtn").onclick = async () => {
    const name = document.getElementById("watchlistName").value.trim();
    const isPublic = document.getElementById("isPublicCheckbox").checked;
    
    if (!name) {
      alert("Please enter a watchlist name");
      return;
    }
    
    const watchlist = await Model.createWatchlist(store.currentUser.id, name, isPublic);
    if (!watchlist) {
      alert("Error creating watchlist");
      return;
    }
    
    alert("Watchlist created!");
    Utils.hideModal('createWatchlistModal', 'modalOverlay');
    
    if (store.currentView === "my") {
      await loadMyWatchlists();
    } else {
      await loadPublicWatchlists();
    }
  };
  
  document.getElementById("cancelWatchlistBtn").onclick = () => {
    Utils.hideModal('createWatchlistModal', 'modalOverlay');
  };
}

// En la función loadMyWatchlists:
export async function loadMyWatchlists() {
  if (!store.currentUser) return;
  
  store.currentView = "my";
  
  // Actualizar título del sidebar
  const watchlistTitle = document.getElementById("watchlistTitle");
  if (watchlistTitle) {
    watchlistTitle.textContent = "Your Watchlists";
  }
  
  const watchlists = await Model.getUserWatchlists(store.currentUser.id);
  View.renderWatchlists(watchlists, "my");
}

// En la función loadPublicWatchlists:
export async function loadPublicWatchlists() {
  store.currentView = "public";
  
  // Actualizar título del sidebar
  const watchlistTitle = document.getElementById("watchlistTitle");
  if (watchlistTitle) {
    watchlistTitle.textContent = "Public Watchlists";
  }
  
  const watchlists = await Model.getPublicWatchlists();
  View.renderWatchlists(watchlists, "public");
}

async function handleViewWatchlist(watchlistId) {
  const watchlists = store.currentView === "my"
    ? await Model.getUserWatchlists(store.currentUser.id)
    : await Model.getPublicWatchlists();
  
  const watchlist = watchlists.find(w => w.id === watchlistId);
  if (!watchlist) return;
  
  store.currentWatchlist = watchlist;
  store.previousView = "watchlist";
  store.previousViewData = watchlistId;
  
  const movies = await Model.getWatchlistMovies(watchlistId);
  
  const userRatings = {};
  if (store.currentUser) {
    for (const movie of movies) {
      const rating = await Model.getUserRatingForTMDBMovie(movie.id);
      if (rating) userRatings[movie.id] = rating;
    }
  }
  
  View.renderWatchlistView(watchlist, movies, userRatings);
  
  setTimeout(() => {
    movies.forEach(movie => {
      const userRating = userRatings[movie.id];
      const ratingValue = userRating ? userRating.score : 0;
      
      const starContainer = document.querySelector(`.watchlist-movie[data-movie-id="${movie.id}"] .star-rating`);
      if (starContainer) {
        const stars = View.renderStars(ratingValue, movie.id);
        starContainer.innerHTML = stars.innerHTML;
      }
    });
  }, 100);
}

async function handleRenameWatchlist() {
  if (!store.currentWatchlist || store.currentUser?.id !== store.currentWatchlist.userId) return;
  
  // Activar modo edición solo para ESTA watchlist
  const watchlistEditId = `watchlist-edit-${store.currentWatchlist.id}`;
  sessionStorage.setItem(watchlistEditId, 'true');
  
  // Volver a renderizar la vista
  const movies = await Model.getWatchlistMovies(store.currentWatchlist.id);
  
  const userRatings = {};
  if (store.currentUser) {
    for (const movie of movies) {
      const rating = await Model.getUserRatingForTMDBMovie(movie.id);
      if (rating) userRatings[movie.id] = rating;
    }
  }
  
  View.renderWatchlistView(store.currentWatchlist, movies, userRatings);
  
  // Enfocar el input después de renderizar
  setTimeout(() => {
    const renameInput = document.getElementById('renameWatchlistInput');
    if (renameInput) {
      renameInput.focus();
      renameInput.select();
    }
  }, 100);
}

// Añade esta función para manejar el guardado del nuevo nombre
async function handleSaveRenameWatchlist() {
  const renameInput = document.getElementById('renameWatchlistInput');
  if (!renameInput || !store.currentWatchlist) return;
  
  const newName = renameInput.value.trim();
  if (!newName) {
    alert("Watchlist name cannot be empty");
    return;
  }
  
  if (newName === store.currentWatchlist.name) {
    // Si el nombre no cambió, solo salir del modo edición
    const watchlistEditId = `watchlist-edit-${store.currentWatchlist.id}`;
    sessionStorage.removeItem(watchlistEditId);
    
    const movies = await Model.getWatchlistMovies(store.currentWatchlist.id);
    const userRatings = {};
    if (store.currentUser) {
      for (const movie of movies) {
        const rating = await Model.getUserRatingForTMDBMovie(movie.id);
        if (rating) userRatings[movie.id] = rating;
      }
    }
    View.renderWatchlistView(store.currentWatchlist, movies, userRatings);
    return;
  }
  
  const updated = await Model.renameWatchlist(store.currentWatchlist.id, newName);
  if (!updated) {
    alert("Error renaming watchlist");
    return;
  }
  
  store.currentWatchlist = updated;
  
  // Salir del modo edición
  const watchlistEditId = `watchlist-edit-${store.currentWatchlist.id}`;
  sessionStorage.removeItem(watchlistEditId);
  
  const movies = await Model.getWatchlistMovies(updated.id);
  
  const userRatings = {};
  if (store.currentUser) {
    for (const movie of movies) {
      const rating = await Model.getUserRatingForTMDBMovie(movie.id);
      if (rating) userRatings[movie.id] = rating;
    }
  }
  
  View.renderWatchlistView(updated, movies, userRatings);
  
  // Actualizar la lista de watchlists en el sidebar
  const watchlists = store.currentView === "my"
    ? await Model.getUserWatchlists(store.currentUser.id)
    : await Model.getPublicWatchlists();
  
  View.renderWatchlists(watchlists);
}

// Añade esta función para cancelar el renombrado
function handleCancelRenameWatchlist() {
  if (!store.currentWatchlist) return;
  
  const watchlistEditId = `watchlist-edit-${store.currentWatchlist.id}`;
  sessionStorage.removeItem(watchlistEditId);
  
  // Volver a renderizar en modo visualización
  handleViewWatchlist(store.currentWatchlist.id);
}

async function handleToggleWatchlistPrivacy() {
  if (!store.currentWatchlist || store.currentUser?.id !== store.currentWatchlist.userId) return;
  
  const updated = await Model.toggleWatchlistPrivacy(
    store.currentWatchlist.id, 
    !store.currentWatchlist.isPublic
  );
  
  if (!updated) {
    alert("Error updating privacy");
    return;
  }
  
  store.currentWatchlist = updated;
  const movies = await Model.getWatchlistMovies(updated.id);
  View.renderWatchlistView(updated, movies);
  
  const watchlists = store.currentView === "my"
    ? await Model.getUserWatchlists(store.currentUser.id)
    : await Model.getPublicWatchlists();
  
  View.renderWatchlists(watchlists);
}

async function handleDeleteWatchlist() {
  if (!store.currentWatchlist || store.currentUser?.id !== store.currentWatchlist.userId) return;
  
  const confirmDelete = confirm(
    `Are you sure you want to delete "${store.currentWatchlist.name}"? This cannot be undone.`
  );
  
  if (!confirmDelete) return;
  
  await Model.deleteWatchlist(store.currentWatchlist.id);
  store.currentWatchlist = null;
  
  handleCloseWatchlist();
  await loadMyWatchlists();
}

// En la función handleAddMovieToWatchlist, añade verificación:
async function handleAddMovieToWatchlist(watchlistId, movie) {
  console.log(`Adding movie ${movie.id} to watchlist ${watchlistId}`);
  
  // Verificar que la watchlist pertenece al usuario
  const isOwner = await Model.verifyWatchlistOwnership(watchlistId);
  
  if (!isOwner) {
    alert("You can only add movies to your own watchlists");
    return;
  }
  
  const success = await Model.addMovieToWatchlist(watchlistId, movie);
  if (!success) {
    // El mensaje de error ya se muestra en el modelo
    return;
  }
  
  alert("Movie added to watchlist!");
  
  // Actualizar la vista si estamos viendo esa watchlist
  if (store.currentWatchlist?.id === watchlistId) {
    const movies = await Model.getWatchlistMovies(watchlistId);
    
    const userRatings = {};
    if (store.currentUser) {
      for (const movie of movies) {
        const rating = await Model.getUserRatingForTMDBMovie(movie.id);
        if (rating) userRatings[movie.id] = rating;
      }
    }
    
    View.renderWatchlistView(store.currentWatchlist, movies, userRatings);
  }
}

async function handleRemoveMovieFromWatchlist(movieId) {
  if (!store.currentWatchlist) return;
  
  const confirmRemove = confirm(`Are you sure you want to remove this movie from "${store.currentWatchlist.name}"?`);
  if (!confirmRemove) return;
  
  const success = await Model.removeMovieFromWatchlist(store.currentWatchlist.id, movieId);
  if (!success) {
    alert("Error removing movie");
    return;
  }
  
  const movies = await Model.getWatchlistMovies(store.currentWatchlist.id);
  
  const userRatings = {};
  if (store.currentUser) {
    for (const movie of movies) {
      const rating = await Model.getUserRatingForTMDBMovie(movie.id);
      if (rating) userRatings[movie.id] = rating;
    }
  }
  
  View.renderWatchlistView(store.currentWatchlist, movies, userRatings);
  
  setTimeout(() => {
    movies.forEach(movie => {
      const userRating = userRatings[movie.id];
      const ratingValue = userRating ? userRating.score : 0;
      
      const starContainer = document.querySelector(`.watchlist-movie[data-movie-id="${movie.id}"] .star-rating`);
      if (starContainer) {
        const stars = View.renderStars(ratingValue, movie.id);
        starContainer.innerHTML = stars.innerHTML;
      }
    });
  }, 100);
}

// ==================== SEARCH ====================
export async function handleSearch() {
  const query = document.getElementById("searchInput").value.trim();
  
  if (!query) {
    await showTrending();
    return;
  }
  
  store.pagination.currentType = 'search';
  store.pagination.currentQuery = query;
  store.pagination.currentPage = 1;
  
  store.pushToHistory("search", query);
  store.previousView = "search";
  store.previousViewData = query;
  View.showView('search');
  
  await loadSearchPage();
}

// ==================== MOVIE DETAIL ====================
async function handleMovieClick(movieId) {
  store.previousView = "movieDetail";
  store.previousViewData = movieId;
  store.pushToHistory("movieDetail", movieId);
  
  Utils.navigate("movie");
  document.getElementById("backToHomeBtn").onclick = goBackFromMovieDetail;
  View.updateBackButton();
  
  await showMovieDetail(movieId);
}

async function showMovieDetail(movieId) {
  const movie = await Model.getMovieDetails(movieId);
  
  let userRating = null;
  let averageRating = null;
  let comments = [];
  
  if (store.currentUser) {
    userRating = await Model.getUserRatingForTMDBMovie(movieId);
  }
  
  // Usar la nueva función del modelo
  const localMovie = await Model.getLocalMovieByExternalId(movieId);
  
  if (localMovie) {
    averageRating = await Model.getAverageRating(localMovie.id);
    comments = await Model.getMovieComments(movieId);
  }
  
  View.renderMovieDetail(movie, userRating, averageRating, comments);
  
  // Asegurar que el botón de submit tiene el movieId correcto
  setTimeout(() => {
    const submitBtn = document.getElementById("submitCommentBtn");
    if (submitBtn) {
      submitBtn.setAttribute("data-movie-id", movieId);
    }
  }, 100);
  
  if (store.currentUser) {
    const watchlists = await Model.getUserWatchlists(store.currentUser.id);
    const addBox = View.renderAddToWatchlist(movie, watchlists);
    document.getElementById("movieDetailContent").appendChild(addBox);
  }
}

async function handleRateMovie(movieId, score) {
  if (!store.currentUser) {
    alert("Please log in to rate movies");
    return;
  }
  
  try {
    const movie = await Model.getMovieDetails(movieId);
    const localMovieId = await Model.ensureMovieExists(movie);
    
    if (!localMovieId) {
      alert("Error rating movie");
      return;
    }
    
    const result = await Model.rateMovie(localMovieId, score);
    
    if (result) {
      updateStarsForMovie(movieId, score);
      updateMovieRatingDisplay(movieId, score);
      
      if (document.getElementById("movieDetailView").style.display === "block") {
        await showMovieDetail(movieId);
      }
    }
  } catch (error) {
    console.error("Error rating movie:", error);
    alert("Error rating movie. Please try again.");
  }
}

function updateMovieRatingDisplay(movieId, userScore) {
  const movieCards = document.querySelectorAll(`.movie-card[data-movie-id="${movieId}"]`);
  
  movieCards.forEach(card => {
    const ratingText = card.querySelector('small');
    if (ratingText) {
      const tmdbRatingMatch = ratingText.textContent.match(/⭐ (\d+\.?\d*)/);
      if (tmdbRatingMatch) {
        ratingText.textContent = `⭐ ${tmdbRatingMatch[1]} | You: ${userScore}/5`;
      }
    }
  });
}

function updateStarsForMovie(movieId, newScore) {
  const starContainers = document.querySelectorAll(`.star-rating[data-movie-id="${movieId}"]`);
  
  starContainers.forEach(container => {
    const newStars = View.renderStars(newScore, movieId);
    container.innerHTML = newStars.innerHTML;
  });
  
  const currentRatingText = document.getElementById("currentRatingText");
  if (currentRatingText) {
    currentRatingText.textContent = `Your rating: ${newScore}/5`;
  }
}

async function handleAddComment(movieId, text) {
  if (!store.currentUser) {
    alert("Please log in to comment");
    return;
  }
  
  // Aquí movieId es el TMDB ID
  const comment = await Model.addComment(movieId, text);
  if (comment) {
    // Verificar que estamos en la vista de detalle de la misma película
    const movieDetailView = document.getElementById("movieDetailView");
    const isOnMovieDetail = movieDetailView && movieDetailView.style.display === "block";
    
    if (!isOnMovieDetail) {
      console.log("Not on movie detail view, skipping UI update");
      return;
    }
    
    // Verificar que el botón que disparó este evento pertenece a la película actual
    const submitBtn = document.getElementById("submitCommentBtn");
    const btnMovieId = submitBtn ? submitBtn.getAttribute("data-movie-id") : null;
    
    if (btnMovieId !== movieId.toString()) {
      console.log(`Comment added for movie ${movieId}, but current view is for movie ${btnMovieId}`);
      return;
    }
    
    // Obtener comentarios solo para esta película
    const comments = await Model.getMovieComments(movieId);
    const commentsList = document.getElementById("commentsList");
    
    if (!commentsList) {
      console.error("Comments list element not found");
      return;
    }
    
    // Limpiar y renderizar comentarios
    if (comments.length === 0) {
      commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
    } else {
      comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      commentsList.innerHTML = '';
      comments.forEach(comment => {
        const commentDiv = Utils.createElement('div', 'comment');
        commentDiv.innerHTML = `
          <div class="comment-header">
            <strong>${comment.username || "Anonymous"}</strong>
            <span class="comment-date">${Utils.formatDate(comment.createdAt)}</span>
          </div>
          <p class="comment-text">${comment.text}</p>
          ${comment.userId === store.currentUser?.id ? 
            `<button class="delete-comment-btn" data-comment-id="${comment.id}">Delete</button>` : ''}
        `;
        commentsList.appendChild(commentDiv);
      });
    }
  }
}

async function handleDeleteComment(commentId) {
  if (!store.currentUser) return;
  
  const confirmDelete = confirm("Are you sure you want to delete this comment?");
  if (!confirmDelete) return;
  
  const success = await Model.deleteComment(commentId);
  if (success) {
    // Obtener el movieId del botón de submit actual
    const submitBtn = document.getElementById("submitCommentBtn");
    const movieId = submitBtn ? submitBtn.getAttribute("data-movie-id") : store.previousViewData;
    
    if (movieId) {
      // Verificar que estamos en la vista de detalle
      const movieDetailView = document.getElementById("movieDetailView");
      const isOnMovieDetail = movieDetailView && movieDetailView.style.display === "block";
      
      if (!isOnMovieDetail) {
        console.log("Not on movie detail view, skipping UI update");
        return;
      }
      
      const comments = await Model.getMovieComments(movieId);
      const commentsList = document.getElementById("commentsList");
      
      if (!commentsList) {
        console.error("Comments list element not found");
        return;
      }
      
      if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
      } else {
        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        commentsList.innerHTML = '';
        comments.forEach(comment => {
          const commentDiv = Utils.createElement('div', 'comment');
          commentDiv.innerHTML = `
            <div class="comment-header">
              <strong>${comment.username || "Anonymous"}</strong>
              <span class="comment-date">${Utils.formatDate(comment.createdAt)}</span>
            </div>
            <p class="comment-text">${comment.text}</p>
            ${comment.userId === store.currentUser?.id ? 
              `<button class="delete-comment-btn" data-comment-id="${comment.id}">Delete</button>` : ''}
          `;
          commentsList.appendChild(commentDiv);
        });
      }
    }
  }
}
// ==================== GENRES & FILTERS ====================
async function showGenresDropdown() {
  const dropdown = document.getElementById("genresDropdown");
  
  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
  } else {
    const genres = await Model.getGenres();
    View.renderGenresDropdown(genres);
    dropdown.style.display = "block";
    
    const btn = document.getElementById("showGenresBtn");
    const rect = btn.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;
  }
}

async function handleGenreClick(genreId, genreName) {
  document.getElementById("genresDropdown").style.display = "none";
  
  store.pagination.currentType = 'genre';
  store.pagination.currentGenreId = genreId;
  store.pagination.currentGenreName = genreName;
  store.pagination.currentPage = 1;
  
  store.pushToHistory("genre", { genreId, genreName });
  store.previousView = "genre";
  store.previousViewData = { genreId, genreName };
  View.showView('genre');
  
  await loadGenrePage();
}

async function showFiltersModal() {
  Utils.showModal('filtersModal', 'modalOverlay');
  
  const genres = await Model.getGenres();
  const select = document.getElementById("filterGenre");
  select.innerHTML = '<option value="">All Genres</option>';
  genres.forEach(genre => {
    const option = document.createElement("option");
    option.value = genre.id;
    option.textContent = genre.name;
    select.appendChild(option);
  });
  
  document.getElementById("applyFiltersBtn").onclick = async () => {
    const genreId = document.getElementById("filterGenre").value;
    const year = document.getElementById("filterYear").value;
    const minRating = document.getElementById("filterMinRating").value;
    const sortBy = document.getElementById("filterSortBy").value;
    
    const filters = {};
    if (genreId) filters.genreId = genreId;
    if (year) filters.year = year;
    if (minRating) filters.minRating = minRating;
    if (sortBy) filters.sortBy = sortBy;
    
    Utils.hideModal('filtersModal', 'modalOverlay');
    
    if (Object.keys(filters).length > 0) {
      await handleFilterMovies(filters);
    }
  };
  
  document.getElementById("cancelFiltersBtn").onclick = () => {
    Utils.hideModal('filtersModal', 'modalOverlay');
  };
}

async function handleFilterMovies(filters) {
  store.pagination.currentType = 'filtered';
  store.pagination.currentFilters = filters;
  store.pagination.currentPage = 1;
  
  store.pushToHistory("filtered", filters);
  store.previousView = "filtered";
  store.previousViewData = filters;
  View.showView('filtered');
  
  await loadFilteredPage();
}

// ==================== NAVIGATION ====================
// En la función showTrending:
export async function showTrending() {
  store.previousView = "trending";
  View.showView('trending');
  
  const movies = await Model.getTrendingMovies();
  
  const userRatings = {};
  if (store.currentUser) {
    for (const movie of movies) {
      const rating = await Model.getUserRatingForTMDBMovie(movie.id);
      if (rating) userRatings[movie.id] = rating;
    }
  }
  
  View.renderTrendingMovies(movies, userRatings);
  
  // Actualizar título del sidebar a "Public Watchlists"
  const watchlistTitle = document.getElementById("watchlistTitle");
  if (watchlistTitle) {
    watchlistTitle.textContent = "Public Watchlists";
  }
  
  // Cargar watchlists públicas
  await loadPublicWatchlists();
}
export function goBackFromMovieDetail() {
  Utils.navigate("home");
  
  setTimeout(async () => {
    const previous = store.getPreviousView();
    
    if (store.pagination.currentType) {
      switch(store.pagination.currentType) {
        case 'search':
          document.getElementById("searchInput").value = store.pagination.currentQuery;
          await loadSearchPage();
          return;
        case 'genre':
          await loadGenrePage();
          return;
        case 'filtered':
          await loadFilteredPage();
          return;
      }
    }
    
    if (previous && previous.view === "search" && previous.data) {
      document.getElementById("searchInput").value = previous.data;
      await handleSearch();
      return;
    }
    
    if (previous && previous.view === "genre" && previous.data) {
      const { genreId, genreName } = previous.data;
      await handleGenreClick(genreId, genreName);
      return;
    }
    
    if (previous && previous.view === "filtered" && previous.data) {
      await handleFilterMovies(previous.data);
      return;
    }
    
    if (store.currentWatchlist) {
      await handleViewWatchlist(store.currentWatchlist.id);
      return;
    }
    
    if (store.previousView === "search" && store.previousViewData) {
      document.getElementById("searchInput").value = store.previousViewData;
      await handleSearch();
      return;
    }
    
    if (store.previousView === "genre" && store.previousViewData) {
      const { genreId, genreName } = store.previousViewData;
      await handleGenreClick(genreId, genreName);
      return;
    }
    
    if (store.previousView === "filtered" && store.previousViewData) {
      await handleFilterMovies(store.previousViewData);
      return;
    }
    
    await loadHome();
  }, 0);
}

// ==================== UTILITY FUNCTIONS ====================
function handleCloseWatchlist() {
  const container = document.getElementById("watchlistDetail");
  if (container) {
    container.style.display = "none";
    container.classList.remove("open");
  }
  store.currentWatchlist = null;
}

// ==================== PAGINATION FUNCTIONS ====================
export async function handlePageChange(newPage) {
  const pagination = store.pagination;
  
  if (newPage < 1 || newPage > pagination.totalPages) return;
  
  pagination.currentPage = newPage;
  
  switch (pagination.currentType) {
    case 'search':
      await loadSearchPage();
      break;
    case 'genre':
      await loadGenrePage();
      break;
    case 'filtered':
      await loadFilteredPage();
      break;
  }
}

async function loadSearchPage() {
  const { currentPage, currentQuery } = store.pagination;
  
  const results = await Model.searchMovies(currentQuery, currentPage);
  
  store.pagination.totalPages = results.total_pages;
  store.pagination.totalResults = results.total_results;
  
  const userRatings = {};
  if (store.currentUser) {
    for (const movie of results.results) {
      const rating = await Model.getUserRatingForTMDBMovie(movie.id);
      if (rating) userRatings[movie.id] = rating;
    }
  }
  
  View.renderSearchResults(results, userRatings);
}

async function loadGenrePage() {
  const { currentPage, currentGenreId, currentGenreName } = store.pagination;
  
  const results = await Model.getMoviesByGenre(currentGenreId, currentPage);
  
  store.pagination.totalPages = results.total_pages;
  store.pagination.totalResults = results.total_results;
  
  const userRatings = {};
  if (store.currentUser) {
    for (const movie of results.results) {
      const rating = await Model.getUserRatingForTMDBMovie(movie.id);
      if (rating) userRatings[movie.id] = rating;
    }
  }
  
  View.renderMoviesByGenre(results, currentGenreName, userRatings);
}

async function loadFilteredPage() {
  const { currentPage, currentFilters } = store.pagination;
  
  const results = await Model.getMoviesByFilters(currentFilters, currentPage);
  
  store.pagination.totalPages = results.total_pages;
  store.pagination.totalResults = results.total_results;
  
  const userRatings = {};
  if (store.currentUser) {
    for (const movie of results.results) {
      const rating = await Model.getUserRatingForTMDBMovie(movie.id);
      if (rating) userRatings[movie.id] = rating;
    }
  }
  
  View.renderFilteredMovies(results, currentFilters, userRatings);
}