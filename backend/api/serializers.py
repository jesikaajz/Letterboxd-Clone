from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import Movie, Watchlist, WatchlistMovie, Rating, Comment

# Serializador para Usuario
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True}
        }
    
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)

# Serializador para Login
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

# Serializador para Película
class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ['id', 'externalId']

# Serializador para Watchlist
class WatchlistSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = Watchlist
        fields = ['id', 'name', 'userId', 'isPublic']
# REEMPLAZA el WatchlistMovieSerializer con esta versión corregida:
class WatchlistMovieSerializer(serializers.ModelSerializer):
    watchlistId = serializers.UUIDField(write_only=True)
    movieId = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = WatchlistMovie
        fields = ['id', 'watchlistId', 'movieId']
    
    def create(self, validated_data):
        print(f"🎬 [Serializer] Creating WatchlistMovie")
        
        # Extraer los IDs
        watchlist_id = validated_data.pop('watchlistId')
        movie_id = validated_data.pop('movieId')
        
        print(f"📋 Data received: watchlist={watchlist_id}, movie={movie_id}")
        
        # Obtener los objetos
        try:
            watchlist = Watchlist.objects.get(id=watchlist_id)
            print(f"✅ Watchlist found: {watchlist.name} (ID: {watchlist.id})")
        except Watchlist.DoesNotExist:
            print(f"❌ Watchlist {watchlist_id} not found")
            raise serializers.ValidationError({"error": "Watchlist not found"})
        
        try:
            movie = Movie.objects.get(id=movie_id)
            print(f"✅ Movie found: ID: {movie.id}, externalId: {movie.externalId}")
        except Movie.DoesNotExist:
            print(f"❌ Movie {movie_id} not found")
            raise serializers.ValidationError({"error": "Movie not found"})
        
        # Verificar que no existe ya la relación
        if WatchlistMovie.objects.filter(watchlist=watchlist, movie=movie).exists():
            print(f"⚠️ Movie {movie.id} already in watchlist {watchlist.id}")
            raise serializers.ValidationError({"error": "This movie is already in the watchlist"})
        
        # IMPORTANTE: Obtener el usuario del contexto del serializer
        user = None
        request = self.context.get('request')
        if request:
            user = request.user
            print(f"👤 User from request: {user.id if user else 'None'}")
        
        # Si no hay usuario del request, intentar obtenerlo de otra manera
        if not user:
            # Intentar obtener el usuario de la watchlist
            user = watchlist.user
            print(f"👤 User from watchlist: {user.id if user else 'None'}")
        
        # Verificar que el usuario es propietario de la watchlist
        if user and watchlist.user != user:
            print(f"🚫 User {user.id} is not owner of watchlist {watchlist.id}")
            raise serializers.ValidationError({"error": "You don't have permission to add movies to this watchlist"})
        
        # Crear la relación
        watchlist_movie = WatchlistMovie.objects.create(
            watchlist=watchlist,
            movie=movie
        )
        
        print(f"✅ Created WatchlistMovie {watchlist_movie.id}")
        return watchlist_movie
    
    def to_representation(self, instance):
        # Asegurar que siempre devolvemos movieId y watchlistId
        representation = {
            'id': str(instance.id),
            'watchlistId': str(instance.watchlist.id),
            'movieId': str(instance.movie.id),
            'watchlist': {
                'id': str(instance.watchlist.id),
                'name': instance.watchlist.name,
                'userId': instance.watchlist.user.id if instance.watchlist.user else None
            },
            'movie': {
                'id': str(instance.movie.id),
                'externalId': instance.movie.externalId
            }
        }
        print(f"📤 Serializer representation: {representation}")
        return representation
        
# Serializador para Rating
class RatingSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True)
    movie_uuid = serializers.UUIDField(write_only=True, required=False)
    movieId = serializers.UUIDField(source='movie.id', read_only=True)
    
    class Meta:
        model = Rating
        fields = ['id', 'userId', 'movieId', 'movie_uuid', 'score', 'createdAt']
        read_only_fields = ['createdAt', 'userId', 'movieId']
    
    def create(self, validated_data):
        print(f"⭐ [Serializer] Creating Rating")
        
        # Extraer movie_uuid (solo para creación)
        movie_uuid = validated_data.pop('movie_uuid')
        
        try:
            movie = Movie.objects.get(id=movie_uuid)
            print(f"✅ Movie found for rating: {movie.id}")
        except Movie.DoesNotExist:
            print(f"❌ Movie {movie_uuid} not found for rating")
            raise serializers.ValidationError({"movie_uuid": "Movie not found"})
        
        user = self.context['request'].user
        score = validated_data.get('score', 0)
        
        print(f"📊 Creating rating: user={user.id}, movie={movie.id}, score={score}")
        
        # Verificar si ya existe una calificación
        rating, created = Rating.objects.update_or_create(
            user=user,
            movie=movie,
            defaults={'score': score}
        )
        
        print(f"✅ Rating {'created' if created else 'updated'}: {rating.id}")
        return rating
    
    def update(self, instance, validated_data):
        print(f"🔄 [Serializer] Updating Rating {instance.id}")
        
        # En update, NO permitir cambiar la película
        if 'movie_uuid' in validated_data:
            validated_data.pop('movie_uuid')
        
        # Solo actualizar el score
        instance.score = validated_data.get('score', instance.score)
        instance.save()
        
        print(f"✅ Rating updated: score={instance.score}")
        return instance

# Serializador para Comentarios
class CommentSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    movieId = serializers.UUIDField(source='movie.id', read_only=True)
    movie_uuid = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'userId', 'username', 'movieId', 'movie_uuid', 'text', 'createdAt']
        read_only_fields = ['createdAt', 'username', 'userId', 'movieId']
    
    def create(self, validated_data):
        print(f"💬 [Serializer] Creating Comment")
        
        # Extraer movie_uuid
        movie_uuid = validated_data.pop('movie_uuid')
        
        # Obtener el objeto Movie
        try:
            movie = Movie.objects.get(id=movie_uuid)
            print(f"✅ Movie found for comment: {movie.id}")
        except Movie.DoesNotExist:
            print(f"❌ Movie {movie_uuid} not found for comment")
            raise serializers.ValidationError({"movie_uuid": "Movie not found"})
        
        # Obtener el usuario
        user = self.context['request'].user
        
        print(f"📝 Creating comment: user={user.id}, movie={movie.id}")
        
        # Crear el comentario
        comment = Comment.objects.create(
            user=user,
            movie=movie,
            text=validated_data.get('text', '')
        )
        
        print(f"✅ Comment created: {comment.id}")
        return comment