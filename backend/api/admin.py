from django.contrib import admin
from .models import Movie, Watchlist, WatchlistMovie, Rating, Comment

# NO registres el modelo User aquí - ya está registrado por Django
# @admin.register(User)
# class UserAdmin(admin.ModelAdmin):
#     list_display = ('username', 'email', 'is_staff')
#     search_fields = ('username', 'email')

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('id', 'externalId')
    search_fields = ('externalId',)

@admin.register(Watchlist)
class WatchlistAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'isPublic')
    list_filter = ('isPublic',)
    search_fields = ('name', 'user__username')

@admin.register(WatchlistMovie)
class WatchlistMovieAdmin(admin.ModelAdmin):
    list_display = ('watchlist', 'movie')
    search_fields = ('watchlist__name', 'movie__externalId')

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'score', 'createdAt')
    list_filter = ('score', 'createdAt')
    search_fields = ('user__username', 'movie__externalId')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'createdAt')
    search_fields = ('user__username', 'text', 'movie__externalId')
    list_filter = ('createdAt',)