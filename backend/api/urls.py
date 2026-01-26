from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    CustomAuthToken, RegisterView, UserViewSet, MovieViewSet,
    WatchlistViewSet, WatchlistMovieViewSet, RatingViewSet, CommentViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'movies', MovieViewSet)
router.register(r'watchlists', WatchlistViewSet)
router.register(r'watchlist-movies', WatchlistMovieViewSet)
router.register(r'ratings', RatingViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomAuthToken.as_view(), name='login'),
    path('logout/', obtain_auth_token, name='logout'),  # Para invalidar token
]