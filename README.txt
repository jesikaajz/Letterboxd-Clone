**Prerequisites
-Python 3.8+
-Node.js (for development server)
-TMDB API key (free tier)

**Installation
Clone the repository

git clone https://github.com/yourusername/letterboxd-clone.git
cd letterboxd-clone

Set up the backend

cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

Set up the frontend
cd frontend
# Edit src/utils/utils.js with your TMDB API key
# Serve with any static server (e.g., Python, Node.js)
python -m http.server 8000

Access the application
Frontend: http://localhost:8000
Backend API: http://localhost:8000/api

 Features in Detail

Movie Discovery
-Real-time search with instant results
-Filter by genre, release year, and minimum rating
-Sort by popularity, rating, or release date
-Detailed movie pages with cast, crew, and trailers

Social Features
-Rate movies with 5-star system
-Comment on any movie
-View other users' public watchlists
-See average community ratings

Watchlist System
-Create unlimited watchlists
-Toggle between public and private
-Add/remove movies with one click
-Rename and reorganize easily

User Experience
-Persistent login sessions
-Responsive design for mobile/desktop
-Smooth animations and transitions
-Intuitive navigation with breadcrumbs

 Advanced Features

-State Management
-Custom store implementation for global state
-localStorage persistence for user sessions

History tracking for seamless navigation

-Performance Optimizations
-Lazy loading for movie posters

Efficient pagination (20 items per page)

-Cached API responses
-Debounced search input

Code Architecture
-Clean separation of concerns (MVC)

Modular component design
-Reusable utility functions
-Comprehensive error handling

 Development
API Endpoints
text
GET    /api/movies/           # List all movies
POST   /api/movies/           # Add new movie
GET    /api/watchlists/       # User's watchlists
POST   /api/watchlists/       # Create watchlist
GET    /api/ratings/          # Movie ratings
POST   /api/ratings/          # Submit rating
GET    /api/comments/         # Movie comments
POST   /api/comments/         # Add comment
Data Models
User: Authentication and profile data

Movie: TMDB integration with local metadata

Watchlist: User-created movie collections

Rating: User ratings (1-5 stars)

Comment: User reviews and discussions

