// model/model.js
import { API_URL, TMDB_KEY, TMDB_URL } from '../utils/utils.js';
import store from '../store/store.js';

// ==================== AUTH ====================
// En model.js - REEMPLAZA las funciones de login y register:
// Añade al principio de model.js:
// En model.js, REEMPLAZA la función getAuthHeaders:
function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };
  
  // Verificar si tenemos usuario y token
  if (store.currentUser && store.currentUser.token) {
    headers["Authorization"] = `Token ${store.currentUser.token}`;
    console.log("Auth headers set with token:", store.currentUser.token.substring(0, 20) + "...");
  } else {
    console.warn("No token available for auth headers");
  }
  
  return headers;
}


export async function login(username, password) {
  try {
    const res = await fetch(`${API_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await res.json();
    return {
      id: data.user_id,
      username: data.username,
      token: data.token
    };
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function register(username, password) {
  try {
    const res = await fetch(`${API_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Registration failed");
    }

    const data = await res.json();
    return {
      id: data.user_id,
      username: data.username,
      token: data.token
    };
  } catch (error) {
    console.error("Registration error:", error);
    return null;
  }
}

// ==================== MOVIES ====================
export async function getTrendingMovies() {
  const res = await fetch(
    `${TMDB_URL}/trending/movie/week?api_key=${TMDB_KEY}`
  );
  const data = await res.json();
  return data.results;
}

export async function getMovieDetails(id) {
  const res = await fetch(
    `${TMDB_URL}/movie/${id}?api_key=${TMDB_KEY}`
  );
  return res.json();
}

export async function searchMovies(query, page = 1) {
  const res = await fetch(
    `${TMDB_URL}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=${page}`
  );
  const data = await res.json();
  return {
    results: data.results,
    total_pages: data.total_pages,
    total_results: data.total_results,
    page: data.page
  };
}

export async function getGenres() {
  try {
    const res = await fetch(
      `${TMDB_URL}/genre/movie/list?api_key=${TMDB_KEY}`
    );
    const data = await res.json();
    return data.genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

export async function getMoviesByGenre(genreId, page = 1) {
  try {
    const res = await fetch(
      `${TMDB_URL}/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`
    );
    const data = await res.json();
    return {
      results: data.results || [],
      total_pages: data.total_pages,
      total_results: data.total_results,
      page: data.page
    };
  } catch (error) {
    console.error("Error fetching movies by genre:", error);
    return { results: [], total_pages: 0, total_results: 0, page: 1 };
  }
}

export async function getMoviesByFilters(filters = {}, page = 1) {
  try {
    let url = `${TMDB_URL}/discover/movie?api_key=${TMDB_KEY}&page=${page}`;
    
    if (filters.genreId) url += `&with_genres=${filters.genreId}`;
    if (filters.year) url += `&primary_release_year=${filters.year}`;
    if (filters.minRating) url += `&vote_average.gte=${filters.minRating}`;
    if (filters.sortBy) url += `&sort_by=${filters.sortBy}`;
    
    const res = await fetch(url);
    const data = await res.json();
    return {
      results: data.results || [],
      total_pages: data.total_pages,
      total_results: data.total_results,
      page: data.page
    };
  } catch (error) {
    console.error("Error fetching filtered movies:", error);
    return { results: [], total_pages: 0, total_results: 0, page: 1 };
  }
}

// ==================== WATCHLISTS ====================
export async function createWatchlist(userId, name, isPublic) {
  try {
    const res = await fetch(`${API_URL}/watchlists/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        name, 
        isPublic 
      })
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Error creating watchlist:", error);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error creating watchlist:", error);
    return null;
  }
}

export async function getUserWatchlists(userId) {
  try {
    const res = await fetch(`${API_URL}/watchlists/`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn("Unauthorized - User not logged in");
        return [];
      }
      console.error("Error fetching user watchlists:", res.status);
      return [];
    }

    const allWatchlists = await res.json();
    
    // Filtrar para obtener solo las watchlists del usuario actual
    const userWatchlists = allWatchlists.filter(watchlist => {
      // Asegurarse de que watchlist.userId sea un número para comparar
      const watchlistUserId = parseInt(watchlist.userId || watchlist.user);
      return watchlistUserId === parseInt(userId);
    });
    
    console.log(`Found ${userWatchlists.length} watchlists for user ${userId}`);
    return userWatchlists;
  } catch (error) {
    console.error("Error fetching user watchlists:", error);
    return [];
  }
}


export async function getPublicWatchlists() {
  try {
    // Para watchlists públicas, ahora CON autenticación
    const res = await fetch(`${API_URL}/watchlists/`, {
      headers: getAuthHeaders()  // Añadir headers de autenticación
    });
    
    if (!res.ok) {
      console.error("Error fetching public watchlists:", res.status);
      
      // Si es error 401, el usuario no está autenticado
      if (res.status === 401) {
        console.warn("User not authenticated for public watchlists");
        
        // Opción 1: Intentar sin autenticación como fallback
        try {
          const fallbackRes = await fetch(`${API_URL}/watchlists/`);
          if (fallbackRes.ok) {
            const allWatchlists = await fallbackRes.json();
            const publicWatchlists = allWatchlists.filter(watchlist => 
              watchlist.isPublic === true
            );
            console.log(`Found ${publicWatchlists.length} public watchlists (fallback)`);
            return publicWatchlists;
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
      }
      
      return [];
    }

    const allWatchlists = await res.json();
    
    // Filtrar solo las watchlists públicas
    const publicWatchlists = allWatchlists.filter(watchlist => 
      watchlist.isPublic === true
    );
    
    console.log(`Found ${publicWatchlists.length} public watchlists`);
    return publicWatchlists;
  } catch (error) {
    console.error("Error fetching public watchlists:", error);
    return [];
  }
}

// REEMPLAZA la función getWatchlistMovies con esta versión corregida:
export async function getWatchlistMovies(watchlistId) {
  try {
    console.log(`🎬 Getting movies for watchlist ${watchlistId}`);
    
    // Primero obtener las relaciones watchlist-movie
    const relRes = await fetch(
      `${API_URL}/watchlist-movies/?watchlist=${watchlistId}`,
      {
        headers: getAuthHeaders()
      }
    );
    
    if (!relRes.ok) {
      console.error("❌ Error fetching watchlist movies relations:", relRes.status);
      return [];
    }

    const relations = await relRes.json();
    console.log(`📊 Found ${relations.length} movie relations for watchlist ${watchlistId}`);
    console.log("📋 Relations data:", relations);

    const movies = [];
    
    // Para cada relación, obtener los detalles de la película
    for (const rel of relations) {
      try {
        // Verificar que tenemos un movieId válido
        const movieId = rel.movieId || (rel.movie && rel.movie.id);
        if (!movieId) {
          console.error("⚠️ No movieId found in relation:", rel);
          continue;
        }
        
        console.log(`🎞️ Fetching movie with ID: ${movieId}`);
        
        // Obtener la película local primero
        const movieRes = await fetch(`${API_URL}/movies/${movieId}/`, {
          headers: getAuthHeaders()
        });
        
        if (!movieRes.ok) {
          console.error(`❌ Error fetching movie ${movieId}:`, movieRes.status);
          continue;
        }
        
        const movie = await movieRes.json();
        console.log(`✅ Local movie found:`, movie);
        
        // Luego obtener los detalles de TMDB
        const tmdbRes = await fetch(
          `${TMDB_URL}/movie/${movie.externalId}?api_key=${TMDB_KEY}`
        );
        
        if (!tmdbRes.ok) {
          console.error(`❌ Error fetching TMDB movie ${movie.externalId}:`, tmdbRes.status);
          continue;
        }
        
        const tmdbMovie = await tmdbRes.json();
        console.log(`✅ TMDB movie found: ${tmdbMovie.title}`);
        movies.push(tmdbMovie);
      } catch (error) {
        console.error(`❌ Error processing movie for watchlist ${watchlistId}:`, error);
      }
    }

    console.log(`🎉 Successfully loaded ${movies.length} movies for watchlist ${watchlistId}`);
    return movies;
  } catch (error) {
    console.error("❌ Error getting watchlist movies:", error);
    return [];
  }
}
// ==================== WATCHLIST FUNCTIONS ====================

export async function renameWatchlist(watchlistId, newName) {
  try {
    console.log(`Renaming watchlist ${watchlistId} to "${newName}"`);
    
    // ¡AGREGAR SLASH FINAL!
    const res = await fetch(`${API_URL}/watchlists/${watchlistId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        name: newName 
      })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error renaming watchlist:", res.status, errorText);
      return null;
    }
    
    const updatedWatchlist = await res.json();
    console.log("✅ Watchlist renamed successfully:", updatedWatchlist);
    return updatedWatchlist;
  } catch (error) {
    console.error("Error in renameWatchlist:", error);
    return null;
  }
}

export async function toggleWatchlistPrivacy(watchlistId, isPublic) {
  try {
    console.log(`Toggling privacy for watchlist ${watchlistId} to ${isPublic ? 'public' : 'private'}`);
    
    // ¡AGREGAR SLASH FINAL!
    const res = await fetch(`${API_URL}/watchlists/${watchlistId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        isPublic: isPublic 
      })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error toggling privacy:", res.status, errorText);
      return null;
    }
    
    const updatedWatchlist = await res.json();
    console.log("✅ Privacy toggled successfully:", updatedWatchlist);
    return updatedWatchlist;
  } catch (error) {
    console.error("Error in toggleWatchlistPrivacy:", error);
    return null;
  }
}

// ==================== DELETE WATCHLIST ====================
export async function deleteWatchlist(watchlistId) {
  try {
    // Primero eliminar todas las relaciones de películas
    const relRes = await fetch(
      `${API_URL}/watchlist-movies/?watchlist=${watchlistId}`,
      {
        headers: getAuthHeaders()
      }
    );
    
    if (relRes.ok) {
      const relations = await relRes.json();
      
      for (const rel of relations) {
        await fetch(`${API_URL}/watchlist-movies/${rel.id}/`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
      }
    }

    // Luego eliminar la watchlist
    const deleteRes = await fetch(`${API_URL}/watchlists/${watchlistId}/`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });

    if (!deleteRes.ok) {
      console.error("Error deleting watchlist:", deleteRes.status);
      return false;
    }
    
    console.log(`Successfully deleted watchlist ${watchlistId}`);
    return true;
  } catch (error) {
    console.error("Error in deleteWatchlist:", error);
    return false;
  }
}

// ==================== VERIFY WATCHLIST OWNERSHIP ====================
export async function verifyWatchlistOwnership(watchlistId) {
  if (!store.currentUser) {
    console.log("⚠️ No current user for ownership verification");
    return false;
  }
  
  try {
    console.log(`🔍 Verifying ownership of watchlist ${watchlistId} for user ${store.currentUser.id}`);
    
    const res = await fetch(`${API_URL}/watchlists/${watchlistId}/`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      console.error("❌ Error fetching watchlist:", res.status);
      return false;
    }
    
    const watchlist = await res.json();
    console.log("📋 Watchlist data:", watchlist);
    
    const watchlistUserId = parseInt(watchlist.userId || watchlist.user);
    const currentUserId = parseInt(store.currentUser.id);
    
    const isOwner = watchlistUserId === currentUserId;
    console.log(`👤 Ownership check: ${isOwner ? "✅ User owns watchlist" : "❌ User does NOT own watchlist"}`);
    
    return isOwner;
  } catch (error) {
    console.error("❌ Error in verifyWatchlistOwnership:", error);
    return false;
  }
}
// Actualiza ensureMovieExists para usar la nueva función
export async function ensureMovieExists(tmdbMovie) {
  try {
    console.log(`Checking/creating movie for TMDB ID: ${tmdbMovie.id}, Title: ${tmdbMovie.title}`);
    
    // Usar la nueva función mejorada
    const existingMovie = await findLocalMovieByExternalId(tmdbMovie.id);
    
    if (existingMovie) {
      console.log(`✅ Movie ${tmdbMovie.id} already exists with ID: ${existingMovie.id}`);
      return existingMovie.id;
    }
    
    console.log(`🆕 Creating new movie for TMDB ID: ${tmdbMovie.id}`);
    
    const movieData = {
      externalId: tmdbMovie.id
    };
    
    console.log("Sending movie data:", movieData);
    
    const createRes = await fetch(`${API_URL}/movies/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(movieData)
    });
    
    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.error("Error creating movie:", createRes.status, errorText);
      return null;
    }
    
    const movie = await createRes.json();
    console.log(`✅ Created new movie with ID: ${movie.id} for TMDB ID: ${movie.externalId}`);
    return movie.id;
  } catch (error) {
    console.error("Error in ensureMovieExists:", error);
    return null;
  }
}


// REEMPLAZA la función addMovieToWatchlist con esta versión mejorada:
export async function addMovieToWatchlist(watchlistId, tmdbMovie) {
  try {
    console.log(`🎬 Adding movie ${tmdbMovie.id} "${tmdbMovie.title}" to watchlist ${watchlistId}`);
    
    // 1. Asegurar que la película existe localmente
    let movieId;
    
    // Primero intentar encontrar la película existente
    const existingMovie = await findLocalMovieByExternalId(tmdbMovie.id);
    
    if (existingMovie) {
      movieId = existingMovie.id;
      console.log(`✅ Using existing movie ID: ${movieId}`);
    } else {
      // Crear nueva película
      console.log(`🆕 Creating new movie for TMDB ID: ${tmdbMovie.id} - ${tmdbMovie.title}`);
      
      const createRes = await fetch(`${API_URL}/movies/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          externalId: tmdbMovie.id
        })
      });
      
      if (!createRes.ok) {
        const errorText = await createRes.text();
        console.error("❌ Error creating movie:", createRes.status, errorText);
        alert("Error creating movie record");
        return false;
      }
      
      const newMovie = await createRes.json();
      movieId = newMovie.id;
      console.log(`✅ Created new movie with ID: ${movieId} (TMDB: ${newMovie.externalId})`);
    }
    
    // 2. Crear la relación
    const requestData = {
      watchlistId: watchlistId,
      movieId: movieId
    };
    
    console.log("📤 Sending POST request to /watchlist-movies/ with data:", requestData);
    
    const createRelRes = await fetch(`${API_URL}/watchlist-movies/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData)
    });
    
    console.log(`📥 Response status: ${createRelRes.status}`);
    
    if (!createRelRes.ok) {
      const errorText = await createRelRes.text();
      console.error("❌ Error response from server:", createRelRes.status, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          alert(`Error: ${errorJson.error}`);
        } else if (createRelRes.status === 400 && errorText.includes("already")) {
          alert("This movie is already in the watchlist");
        } else {
          alert("Error adding movie to watchlist");
        }
      } catch {
        if (createRelRes.status === 400) {
          alert("This movie is already in the watchlist");
        } else {
          alert("Error adding movie to watchlist");
        }
      }
      return false;
    }
    
    const responseData = await createRelRes.json();
    console.log("✅ Success! Response from server:", responseData);
    alert("🎉 Movie added to watchlist successfully!");
    return true;
    
  } catch (error) {
    console.error("❌ Exception in addMovieToWatchlist:", error);
    alert("Unexpected error adding movie to watchlist");
    return false;
  }
}

export async function removeMovieFromWatchlist(watchlistId, tmdbMovieId) {
  try {
    console.log(`Removing movie ${tmdbMovieId} from watchlist ${watchlistId}`);
    
    // 1. Buscar la película local
    const movieRes = await fetch(
      `${API_URL}/movies?externalId=${tmdbMovieId}`,
      {
        headers: getAuthHeaders()
      }
    );
    
    if (!movieRes.ok) {
      console.error("Error finding movie:", movieRes.status);
      return false;
    }
    
    const movies = await movieRes.json();
    console.log(`Found ${movies.length} movies with externalId ${tmdbMovieId}`);

    if (!movies.length) {
      console.error("Movie not found");
      return false;
    }

    const localMovieId = movies[0].id;
    console.log(`Using local movie ID: ${localMovieId}`);
    
    // 2. Buscar la relación (usando el endpoint correcto)
    const relRes = await fetch(
      `${API_URL}/watchlist-movies/?watchlist=${watchlistId}&movie=${localMovieId}`,
      {
        headers: getAuthHeaders()
      }
    );
    
    if (!relRes.ok) {
      console.error("Error finding watchlist-movie relation:", relRes.status);
      return false;
    }
    
    const relations = await relRes.json();
    console.log(`Found ${relations.length} relations`);

    if (!relations.length) {
      console.error("Relation not found");
      return false;
    }

    // 3. Eliminar la relación
    const deleteRes = await fetch(`${API_URL}/watchlist-movies/${relations[0].id}/`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    
    if (!deleteRes.ok) {
      console.error("Error deleting relation:", deleteRes.status);
      return false;
    }

    console.log("✅ Movie removed from watchlist successfully");
    return true;
    
  } catch (error) {
    console.error("Error in removeMovieFromWatchlist:", error);
    return false;
  }
}
// ==================== RATINGS ====================
export async function getMovieRating(movieId) {
  if (!store.currentUser) return null;
  
  const res = await fetch(
    `${API_URL}/ratings?userId=${store.currentUser.id}&movieId=${movieId}`
  );
  const ratings = await res.json();
  return ratings[0] || null;
}

// ==================== RATINGS ====================
// En model.js - función getAverageRating
export async function getAverageRating(movieId) {
  try {
    console.log(`Getting average rating for movie ${movieId}`);
    
    // Usar el parámetro 'movie' en lugar de 'movieId'
    const res = await fetch(`${API_URL}/ratings/?movie=${movieId}`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      console.error("Error fetching average rating:", res.status);
      return null;
    }
    
    const ratings = await res.json();
    console.log(`Found ${ratings.length} ratings for movie ${movieId}`);
    
    if (ratings.length === 0) return null;
    
    const sum = ratings.reduce((acc, rating) => acc + rating.score, 0);
    const average = (sum / ratings.length).toFixed(1);
    console.log(`Average rating: ${average}`);
    
    return average;
  } catch (error) {
    console.error("Error in getAverageRating:", error);
    return null;
  }
}


// REEMPLAZA la función getLocalMovieByExternalId con esta versión corregida:
export async function getLocalMovieByExternalId(externalId) {
  try {
    console.log(`🔍 Finding local movie for externalId: ${externalId}`);
    
    const externalIdNum = parseInt(externalId);
    
    // IMPORTANTE: Usar el parámetro 'externalId' correctamente
    const res = await fetch(`${API_URL}/movies/?externalId=${externalId}`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      console.error("Error fetching local movie:", res.status);
      return null;
    }
    
    const movies = await res.json();
    console.log(`📊 Found ${movies.length} movies for query externalId=${externalId}`);
    
    // DEBUG: Mostrar todos los movies encontrados
    if (movies.length > 0) {
      console.log("Movies returned:", movies.map(m => ({ id: m.id, externalId: m.externalId })));
    }
    
    // Buscar exactamente por externalId
    const correctMovie = movies.find(movie => {
      const movieExternalId = parseInt(movie.externalId);
      return movieExternalId === externalIdNum;
    });
    
    if (correctMovie) {
      console.log(`✅ Correct movie found: ID=${correctMovie.id}, externalId=${correctMovie.externalId}`);
      return correctMovie;
    } else {
      console.log(`❌ No exact match found for externalId=${externalId}`);
      return null;
    }
    
  } catch (error) {
    console.error("Error in getLocalMovieByExternalId:", error);
    return null;
  }
}

// REEMPLAZA la función findLocalMovieByExternalId con esta versión mejorada:
export async function findLocalMovieByExternalId(externalId) {
  try {
    console.log(`🔍 Finding local movie for externalId: ${externalId}`);
    
    const externalIdNum = parseInt(externalId);
    
    // Usar el endpoint que filtra por externalId
    const res = await fetch(`${API_URL}/movies/?externalId=${externalId}`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      console.error("Error fetching movies:", res.status);
      return null;
    }
    
    const movies = await res.json();
    
    // IMPORTANTE: El endpoint puede devolver un array o un objeto
    let moviesArray;
    if (Array.isArray(movies)) {
      moviesArray = movies;
    } else if (movies.results) {
      moviesArray = movies.results;
    } else {
      moviesArray = [movies];
    }
    
    console.log(`📊 Found ${moviesArray.length} movies for query externalId=${externalId}`);
    
    if (moviesArray.length === 0) {
      return null;
    }
    
    // Buscar exactamente por externalId
    const foundMovie = moviesArray.find(movie => {
      const movieExternalId = parseInt(movie.externalId);
      return movieExternalId === externalIdNum;
    });
    
    if (foundMovie) {
      console.log(`✅ Found exact match: ID=${foundMovie.id}, externalId=${foundMovie.externalId}`);
      return foundMovie;
    }
    
    // Si no encuentra exacto, intentar con el primero
    console.log(`⚠️ No exact match, using first result: ID=${moviesArray[0].id}, externalId=${moviesArray[0].externalId}`);
    return moviesArray[0];
    
  } catch (error) {
    console.error("Error in findLocalMovieByExternalId:", error);
    return null;
  }
}

export async function getUserRatingForTMDBMovie(tmdbId) {
  if (!store.currentUser || !store.currentUser.id) {
    console.log("No current user, skipping rating fetch");
    return null;
  }
  
  try {
    // Primero busca la película local
    const movieRes = await fetch(`${API_URL}/movies?externalId=${tmdbId}`, {
      headers: getAuthHeaders()
    });
    
    if (!movieRes.ok) {
      if (movieRes.status === 401) {
        console.warn("Unauthorized access to movies endpoint");
        return null;
      }
      console.error("Error fetching movie:", movieRes.status);
      return null;
    }
    
    const movies = await movieRes.json();
    
    if (movies.length === 0) {
      return null;
    }
    
    const localMovieId = movies[0].id;
    console.log(`Looking for rating for movie ${localMovieId} (TMDB: ${tmdbId})`);
    
    // Buscar ratings y filtrar LOCALMENTE por movieId
    const ratingRes = await fetch(
      `${API_URL}/ratings/?userId=${store.currentUser.id}`,
      {
        headers: getAuthHeaders()
      }
    );
    
    if (!ratingRes.ok) {
      console.warn("No ratings found or unauthorized");
      return null;
    }
    
    const allRatings = await ratingRes.json();
    console.log(`Found ${allRatings.length} total ratings for user`);
    
    // Filtrar por movieId localmente
    const userRating = allRatings.find(rating => 
      rating.movieId === localMovieId
    );
    
    if (userRating) {
      console.log(`✅ Found rating for movie ${localMovieId}: score=${userRating.score}`);
    } else {
      console.log(`❌ No rating found for movie ${localMovieId}`);
    }
    
    return userRating || null;
  } catch (error) {
    console.error("Error getting user rating:", error);
    return null;
  }
}

export async function rateMovie(movieId, score) {
  if (!store.currentUser) {
    console.error("No user logged in for rating");
    return null;
  }

  try {
    console.log(`Rating movie ${movieId} with score ${score}`);
    
    // Buscar TODOS los ratings del usuario
    const allRatingsRes = await fetch(
      `${API_URL}/ratings/?userId=${store.currentUser.id}`,
      {
        headers: getAuthHeaders()
      }
    );
    
    let existingRating = null;
    if (allRatingsRes.ok) {
      const allRatings = await allRatingsRes.json();
      console.log(`Found ${allRatings.length} total ratings for user`);
      
      // Buscar el rating para ESTA película específica
      existingRating = allRatings.find(rating => rating.movieId === movieId);
      
      if (existingRating) {
        console.log(`Found existing rating ${existingRating.id} for movie ${movieId}`);
      }
    }
    
    let result;
    
    if (existingRating) {
      console.log(`Updating existing rating ${existingRating.id}`);
      // Actualizar SOLO el score
      result = await fetch(`${API_URL}/ratings/${existingRating.id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          score: score
        })
      });
    } else {
      console.log(`Creating new rating for movie ${movieId}`);
      // Crear nuevo rating
      result = await fetch(`${API_URL}/ratings/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          movie_uuid: movieId,
          score: score
        })
      });
    }
    
    if (!result.ok) {
      const errorText = await result.text();
      console.error("Error in rateMovie:", result.status, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Error details:", errorJson);
        alert(`Error: ${JSON.stringify(errorJson)}`);
      } catch {
        alert("Error rating movie. Please try again.");
      }
      
      return null;
    }
    
    const rating = await result.json();
    console.log("✅ Rating saved successfully:", rating);
    return rating;
    
  } catch (error) {
    console.error("Error in rateMovie:", error);
    alert("Error rating movie. Please try again.");
    return null;
  }
}

export async function getRatingCount(movieId) {
  const res = await fetch(`${API_URL}/ratings?movieId=${movieId}`);
  const ratings = await res.json();
  return ratings.length;
}

export async function getMovieComments(tmdbId) {
  try {
    console.log(`Getting comments for TMDB movie: ${tmdbId}`);
    
    // Obtener TODOS los comentarios
    const res = await fetch(`${API_URL}/comments/`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      console.error("Error fetching comments:", res.status);
      return [];
    }
    
    let allComments = await res.json();
    console.log(`Received ${allComments.length} total comments from API`);
    
    // Filtrar manualmente: necesitamos encontrar la película local primero
    const movieRes = await fetch(`${API_URL}/movies?externalId=${tmdbId}`, {
      headers: getAuthHeaders()
    });
    
    if (!movieRes.ok) {
      console.error("Error finding movie for comments:", movieRes.status);
      return [];
    }
    
    const movies = await movieRes.json();
    
    if (movies.length === 0) {
      console.log(`No local movie found for TMDB ID: ${tmdbId}`);
      return [];
    }
    
    const localMovieId = movies[0].id;
    
    // Filtrar comentarios por localMovieId
    const filteredComments = allComments.filter(comment => {
      const commentMovieId = comment.movieId || (comment.movie && comment.movie.id);
      return commentMovieId === localMovieId;
    });
    
    console.log(`Filtered to ${filteredComments.length} comments for movie ${localMovieId}`);
    
    return filteredComments;
    
  } catch (error) {
    console.error("Error in getMovieComments:", error);
    return [];
  }
}

// model.js - REEMPLAZA las funciones addComment y deleteComment con esto:

export async function addComment(tmdbId, text) {
  if (!store.currentUser) {
    console.error("No user logged in");
    alert("Please log in to comment");
    return null;
  }

  try {
    console.log(`Adding comment for TMDB movie: ${tmdbId}`);
    
    // 1. Obtener o crear la película local
    let localMovieId;
    
    // Buscar la película en la base de datos
    const movieRes = await fetch(`${API_URL}/movies?externalId=${tmdbId}`, {
      headers: getAuthHeaders()
    });
    
    if (movieRes.ok) {
      const movies = await movieRes.json();
      if (movies.length > 0) {
        localMovieId = movies[0].id;
        console.log(`✅ Found existing movie with ID: ${localMovieId}, externalId: ${movies[0].externalId}`);
      }
    }
    
    // Si no existe, crear una NUEVA con el ID correcto
    if (!localMovieId) {
      console.log(`🆕 Creating new movie for TMDB ID: ${tmdbId}`);
      
      // IMPORTANTE: Crear la película con el externalId CORRECTO
      const movieData = {
        externalId: tmdbId  // Usar el tmdbId real
      };
      
      console.log("Creating movie with data:", movieData);
      
      const createRes = await fetch(`${API_URL}/movies/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(movieData)
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        console.error("Error creating movie:", createRes.status, errorText);
        alert("Error creating movie record");
        return null;
      }
      
      const newMovie = await createRes.json();
      localMovieId = newMovie.id;
      console.log(`✅ Created new movie with ID: ${localMovieId} and externalId: ${newMovie.externalId}`);
    }
    
    // 2. Crear el comentario
    const commentData = {
      movie_uuid: localMovieId,
      text: text.trim()
    };
    
    console.log("Sending comment data:", commentData);
    
    const res = await fetch(`${API_URL}/comments/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(commentData)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error adding comment:", res.status, errorText);
      alert("Error adding comment");
      return null;
    }
    
    const comment = await res.json();
    console.log("✅ Comment created successfully:", comment);
    
    return comment;
    
  } catch (error) {
    console.error("Error in addComment:", error);
    alert("Error adding comment");
    return null;
  }
}
export async function deleteComment(commentId) {
  if (!store.currentUser) return false;
  
  try {
    // PRIMERO: Obtener el comentario para verificar la propiedad
    const commentRes = await fetch(`${API_URL}/comments/${commentId}/`, {
      headers: getAuthHeaders()
    });
    
    if (!commentRes.ok) {
      console.error("Error fetching comment:", commentRes.status);
      return false;
    }
    
    const comment = await commentRes.json();
    
    // Verificar si el usuario actual es el propietario del comentario
    const commentUserId = comment.userId || (comment.user && comment.user.id);
    
    if (!commentUserId || parseInt(commentUserId) !== parseInt(store.currentUser.id)) {
      console.log("User is not the owner of this comment");
      return false;
    }
    
    // SEGUNDO: Eliminar el comentario
    const deleteRes = await fetch(`${API_URL}/comments/${commentId}/`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    
    if (!deleteRes.ok) {
      console.error("Error deleting comment:", deleteRes.status);
      return false;
    }
    
    console.log(`Successfully deleted comment ${commentId}`);
    return true;
    
  } catch (error) {
    console.error("Error in deleteComment:", error);
    return false;
  }
}