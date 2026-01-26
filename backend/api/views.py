from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, status, generics, serializers
from .models import Movie, Watchlist, WatchlistMovie, Rating, Comment
from .serializers import (
    UserSerializer, LoginSerializer, MovieSerializer,
    WatchlistSerializer, WatchlistMovieSerializer,
    RatingSerializer, CommentSerializer
)

# Vista para autenticación
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username=username, password=password)
            
            if user:
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user_id': user.id,
                    'username': user.username
                })
            else:
                return Response(
                    {'error': 'Credenciales inválidas'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Vista para registro de usuarios
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Crear token para el nuevo usuario
        token = Token.objects.create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.id,
            'username': user.username
        }, status=status.HTTP_201_CREATED)

# Vista para Usuarios
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

# Vista para Películas - CORREGIDA CON FILTRO
class MovieViewSet(viewsets.ModelViewSet):
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Movie.objects.all()
        
        # Filtrar por externalId si se proporciona en la query
        external_id = self.request.query_params.get('externalId')
        if external_id:
            try:
                # Convertir a entero para la búsqueda
                external_id_int = int(external_id)
                queryset = queryset.filter(externalId=external_id_int)
            except ValueError:
                # Si no es un número válido, devolver queryset vacío
                queryset = Movie.objects.none()
        
        return queryset
    
    # Mantener el queryset estático para compatibilidad
    queryset = Movie.objects.all()

# Vista para Watchlists - MEJORADA CON PERMISOS ADECUADOS
class WatchlistViewSet(viewsets.ModelViewSet):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Watchlist.objects.none()
        
        # Para operaciones que modifican datos, solo las watchlists del usuario
        if self.request.method in ['POST', 'PATCH', 'PUT', 'DELETE']:
            return Watchlist.objects.filter(user=user)
        
        # Para GET, mostrar watchlists del usuario + públicas de otros
        user_watchlists = Watchlist.objects.filter(user=user)
        public_watchlists = Watchlist.objects.filter(isPublic=True)
        
        # Combinar y eliminar duplicados
        all_watchlists = (user_watchlists | public_watchlists).distinct()
        return all_watchlists
    
    queryset = Watchlist.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    # Sobrescribir update para verificar propiedad
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Verificar que el usuario es el propietario
        if instance.user != request.user:
            return Response(
                {'error': 'No tienes permiso para modificar esta watchlist'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    # Sobrescribir destroy para verificar propiedad
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Verificar que el usuario es el propietario
        if instance.user != request.user:
            return Response(
                {'error': 'No tienes permiso para eliminar esta watchlist'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def movies(self, request, pk=None):
        watchlist = self.get_object()
        
        # Verificar que el usuario puede ver esta watchlist
        if not watchlist.isPublic and watchlist.user != request.user:
            return Response(
                {'error': 'No tienes permiso para ver esta watchlist'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        watchlist_movies = WatchlistMovie.objects.filter(watchlist=watchlist)
        movies = [wm.movie for wm in watchlist_movies]
        serializer = MovieSerializer(movies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_movie(self, request, pk=None):
        watchlist = self.get_object()
        
        # Verificar que el usuario es el propietario
        if watchlist.user != request.user:
            return Response(
                {'error': 'No tienes permiso para añadir películas a esta watchlist'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        movie_id = request.data.get('movieId')
        
        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            return Response(
                {'error': 'Película no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if WatchlistMovie.objects.filter(watchlist=watchlist, movie=movie).exists():
            return Response(
                {'error': 'La película ya está en la watchlist'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        watchlist_movie = WatchlistMovie.objects.create(
            watchlist=watchlist,
            movie=movie
        )
        
        serializer = WatchlistMovieSerializer(watchlist_movie)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Vista para WatchlistMovies - VERSIÓN COMPLETA CORREGIDA
class WatchlistMovieViewSet(viewsets.ModelViewSet):
    serializer_class = WatchlistMovieSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return WatchlistMovie.objects.none()
        
        # Filtrar por watchlist si se proporciona en los parámetros de query
        watchlist_id = self.request.query_params.get('watchlist')
        movie_id = self.request.query_params.get('movie')
        
        queryset = WatchlistMovie.objects.all()
        
        if watchlist_id:
            try:
                # Verificar que la watchlist existe y el usuario tiene permiso
                watchlist = Watchlist.objects.get(id=watchlist_id)
                # El usuario puede verla si es el propietario o es pública
                if watchlist.user == user or watchlist.isPublic:
                    queryset = queryset.filter(watchlist=watchlist)
                else:
                    # Si no tiene permiso, devolver vacío
                    return WatchlistMovie.objects.none()
            except Watchlist.DoesNotExist:
                return WatchlistMovie.objects.none()
        
        if movie_id:
            try:
                movie = Movie.objects.get(id=movie_id)
                queryset = queryset.filter(movie=movie)
            except Movie.DoesNotExist:
                return WatchlistMovie.objects.none()
        
        # Si no hay parámetros específicos, mostrar relaciones donde el usuario tenga permiso
        if not watchlist_id and not movie_id:
            # Watchlists del usuario
            user_watchlists = Watchlist.objects.filter(user=user)
            # Watchlists públicas de otros usuarios
            public_watchlists = Watchlist.objects.filter(isPublic=True)
            # Combinar ambas
            allowed_watchlists = (user_watchlists | public_watchlists).distinct()
            
            queryset = queryset.filter(watchlist__in=allowed_watchlists)
        
        return queryset
    
    # ¡IMPORTANTE! Añade este atributo queryset
    queryset = WatchlistMovie.objects.all()
    
    def get_serializer_context(self):
        # Pasar el request al contexto del serializer
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        # Log para debug
        print(f"👤 [ViewSet] User creating WatchlistMovie: {self.request.user.id} - {self.request.user.username}")
        
        # Validación adicional antes de guardar
        watchlist_id = self.request.data.get('watchlistId')
        movie_id = self.request.data.get('movieId')
        
        print(f"📋 [ViewSet] Creating with watchlistId={watchlist_id}, movieId={movie_id}")
        
        try:
            watchlist = Watchlist.objects.get(id=watchlist_id)
            movie = Movie.objects.get(id=movie_id)
            
            # Verificar que el usuario es propietario de la watchlist
            if watchlist.user != self.request.user:
                print(f"🚫 [ViewSet] User {self.request.user.id} is not owner of watchlist {watchlist.id}")
                raise serializers.ValidationError(
                    {"error": "You don't have permission to add movies to this watchlist"}
                )
            
            # Verificar que no existe ya la relación
            if WatchlistMovie.objects.filter(watchlist=watchlist, movie=movie).exists():
                print(f"⚠️ [ViewSet] Movie {movie.id} already in watchlist {watchlist.id}")
                raise serializers.ValidationError(
                    {"error": "This movie is already in the watchlist"}
                )
            
        except Watchlist.DoesNotExist:
            print(f"❌ [ViewSet] Watchlist {watchlist_id} not found")
            raise serializers.ValidationError({"error": "Watchlist not found"})
        except Movie.DoesNotExist:
            print(f"❌ [ViewSet] Movie {movie_id} not found")
            raise serializers.ValidationError({"error": "Movie not found"})
        
        # Llamar al save del serializer
        serializer.save()
        print(f"✅ [ViewSet] WatchlistMovie created successfully")
    
    def create(self, request, *args, **kwargs):
        # Sobrescribir create para manejar mejor los errores
        try:
            return super().create(request, *args, **kwargs)
        except serializers.ValidationError as e:
            print(f"❌ [ViewSet] Validation error: {e.detail}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"❌ [ViewSet] Unexpected error: {str(e)}")
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Verificar que el usuario es propietario de la watchlist
        if instance.watchlist.user != request.user:
            print(f"🚫 [ViewSet] User {request.user.id} cannot delete from watchlist {instance.watchlist.id}")
            return Response(
                {'error': 'You don\'t have permission to remove movies from this watchlist'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        print(f"🗑️ [ViewSet] Deleting WatchlistMovie {instance.id}")
        return super().destroy(request, *args, **kwargs)
    
    # Endpoint personalizado para obtener películas de una watchlist específica
    @action(detail=False, methods=['get'])
    def by_watchlist(self, request):
        watchlist_id = request.query_params.get('watchlist')
        
        if not watchlist_id:
            return Response(
                {'error': 'watchlist parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            watchlist = Watchlist.objects.get(id=watchlist_id)
            
            # Verificar permisos
            if not watchlist.isPublic and watchlist.user != request.user:
                return Response(
                    {'error': 'You don\'t have permission to view this watchlist'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            watchlist_movies = WatchlistMovie.objects.filter(watchlist=watchlist)
            serializer = self.get_serializer(watchlist_movies, many=True)
            return Response(serializer.data)
            
        except Watchlist.DoesNotExist:
            return Response(
                {'error': 'Watchlist not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Endpoint personalizado para obtener watchlists que contienen una película específica
    @action(detail=False, methods=['get'])
    def by_movie(self, request):
        movie_id = request.query_params.get('movie')
        
        if not movie_id:
            return Response(
                {'error': 'movie parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            movie = Movie.objects.get(id=movie_id)
            
            # Obtener todas las relaciones para esta película
            watchlist_movies = WatchlistMovie.objects.filter(movie=movie)
            
            # Filtrar solo las que el usuario puede ver
            filtered_watchlist_movies = []
            for wm in watchlist_movies:
                if wm.watchlist.isPublic or wm.watchlist.user == request.user:
                    filtered_watchlist_movies.append(wm)
            
            serializer = self.get_serializer(filtered_watchlist_movies, many=True)
            return Response(serializer.data)
            
        except Movie.DoesNotExist:
            return Response(
                {'error': 'Movie not found'},
                status=status.HTTP_404_NOT_FOUND
            )
# Vista para Ratings
class RatingViewSet(viewsets.ModelViewSet):
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Rating.objects.none()
        
        # Filtrar por usuario o por película según los parámetros
        movie_id = self.request.query_params.get('movie')
        user_id = self.request.query_params.get('userId')
        
        queryset = Rating.objects.all()
        
        if movie_id:
            queryset = queryset.filter(movie__id=movie_id)
        
        if user_id:
            queryset = queryset.filter(user__id=user_id)
        
        # Si no hay parámetros específicos, mostrar solo los ratings del usuario
        if not movie_id and not user_id:
            queryset = queryset.filter(user=user)
        
        return queryset
    
    queryset = Rating.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# Vista para Comentarios
class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Comment.objects.none()
        
        queryset = Comment.objects.all()
        
        # Filtrar por movie si se proporciona
        movie_uuid = self.request.query_params.get('movie')
        if movie_uuid:
            queryset = queryset.filter(movie__id=movie_uuid)
        
        # Filtrar por usuario si se proporciona
        user_id = self.request.query_params.get('userId')
        if user_id:
            queryset = queryset.filter(user__id=user_id)
        
        return queryset
    
    queryset = Comment.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Verificar que el usuario es el propietario del comentario
        if instance.user != request.user:
            return Response(
                {'error': 'No tienes permiso para eliminar este comentario'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context