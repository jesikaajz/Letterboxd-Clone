from django.db import models
from django.contrib.auth.models import User  # Importar el User de Django
import uuid

# Modelo de Película
class Movie(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    externalId = models.IntegerField()
    
    class Meta:
        db_table = 'movies'
    
    def __str__(self):
        return f"Movie {self.externalId}"

# Modelo de Watchlist
class Watchlist(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlists')
    isPublic = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'watchlists'
    
    def __str__(self):
        return self.name

# Modelo intermedio para relación muchos a muchos entre Watchlist y Movie
class WatchlistMovie(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    watchlist = models.ForeignKey(Watchlist, on_delete=models.CASCADE, related_name='watchlist_movies')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='movie_watchlists')
    
    class Meta:
        db_table = 'watchlist_movies'
        unique_together = ['watchlist', 'movie']
    
    def __str__(self):
        return f"{self.watchlist.name} - Movie {self.movie.externalId}"

# Modelo de Rating
class Rating(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='ratings')
    score = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # Puntuación de 1 a 5
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ratings'
        unique_together = ['user', 'movie']  # Un usuario solo puede calificar una película una vez
    
    def __str__(self):
        return f"{self.user.username} - {self.movie.externalId}: {self.score}"

# Modelo de Comentario
class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'comments'
        ordering = ['-createdAt']
    
    def __str__(self):
        return f"{self.user.username}: {self.text[:50]}"