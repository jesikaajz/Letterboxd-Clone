import requests
import json
import sys
import os

# Configuración
BASE_URL = "http://localhost:8000/api"
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin"

def print_separator(title=""):
    print("\n" + "="*60)
    if title:
        print(f" {title}")
        print("="*60)
    else:
        print("="*60)

def print_response(response, title=""):
    if title:
        print(f"\n{title}:")
    print(f"Status: {response.status_code}")
    print("Headers:", dict(response.headers))
    
    try:
        if response.text:
            print("Response:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("Response: (empty)")
    except:
        print(f"Response: {response.text}")

def test_register():
    """Prueba de registro de usuario"""
    print_separator("TEST REGISTRO DE USUARIO")
    
    data = {
        "username": "test_user",
        "password": "testpass123"
    }
    
    print(f"Registrando usuario: {data['username']}")
    response = requests.post(f"{BASE_URL}/register/", json=data)
    print_response(response, "Resultado del registro")
    
    if response.status_code == 201:
        return response.json().get('token')
    return None

def test_login(username, password):
    """Prueba de login"""
    print_separator("TEST LOGIN")
    
    data = {
        "username": username,
        "password": password
    }
    
    print(f"Login con usuario: {username}")
    response = requests.post(f"{BASE_URL}/login/", json=data)
    print_response(response, "Resultado del login")
    
    if response.status_code == 200:
        return response.json().get('token')
    return None

def test_protected_endpoint(token, endpoint, method="GET", data=None):
    """Prueba de endpoint protegido con token"""
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    url = f"{BASE_URL}/{endpoint}/"
    
    print(f"\nProbando {method} {endpoint}")
    
    if method == "GET":
        response = requests.get(url, headers=headers)
    elif method == "POST":
        response = requests.post(url, json=data, headers=headers)
    elif method == "PUT":
        response = requests.put(url, json=data, headers=headers)
    elif method == "DELETE":
        response = requests.delete(url, headers=headers)
    elif method == "PATCH":
        response = requests.patch(url, json=data, headers=headers)
    
    print_response(response, f"Resultado {method} {endpoint}")
    return response

def test_users_endpoints(token):
    """Prueba los endpoints de usuarios"""
    print_separator("TEST ENDPOINTS DE USUARIOS")
    
    # Obtener lista de usuarios
    test_protected_endpoint(token, "users")
    
    # Obtener usuario actual
    test_protected_endpoint(token, "users/me")

def test_movies_endpoints(token):
    """Prueba los endpoints de películas"""
    print_separator("TEST ENDPOINTS DE PELÍCULAS")
    
    # Obtener lista de películas
    response = test_protected_endpoint(token, "movies")
    
    if response.status_code == 200 and response.json():
        # Obtener primera película para pruebas
        movies = response.json()
        if movies:
            first_movie_id = movies[0]['id']
            print(f"\nPrimera película ID: {first_movie_id}")
            
            # Obtener detalles de una película específica
            test_protected_endpoint(token, f"movies/{first_movie_id}")
    
    # Crear una nueva película (si es necesario)
    new_movie_data = {
        "externalId": 999999
    }
    test_protected_endpoint(token, "movies", "POST", new_movie_data)

def test_watchlists_endpoints(token):
    """Prueba los endpoints de watchlists"""
    print_separator("TEST ENDPOINTS DE WATCHLISTS")
    
    # Obtener lista de watchlists
    response = test_protected_endpoint(token, "watchlists")
    
    if response.status_code == 200 and response.json():
        watchlists = response.json()
        if watchlists:
            first_watchlist_id = watchlists[0]['id']
            print(f"\nPrimera watchlist ID: {first_watchlist_id}")
            
            # Obtener detalles de una watchlist específica
            test_protected_endpoint(token, f"watchlists/{first_watchlist_id}")
            
            # Obtener películas de una watchlist
            test_protected_endpoint(token, f"watchlists/{first_watchlist_id}/movies")
    
    # Crear una nueva watchlist
    new_watchlist_data = {
        "name": "Mi Watchlist de Prueba",
        "isPublic": True
    }
    create_response = test_protected_endpoint(token, "watchlists", "POST", new_watchlist_data)
    
    # Si se creó, probar añadir película
    if create_response.status_code == 201:
        new_watchlist = create_response.json()
        watchlist_id = new_watchlist['id']
        
        # Primero necesitamos una película existente
        movies_response = requests.get(
            f"{BASE_URL}/movies/",
            headers={"Authorization": f"Token {token}"}
        )
        
        if movies_response.status_code == 200 and movies_response.json():
            first_movie = movies_response.json()[0]
            movie_id = first_movie['id']
            
            # Añadir película a la watchlist
            add_movie_data = {"movieId": movie_id}
            test_protected_endpoint(
                token, 
                f"watchlists/{watchlist_id}/add_movie", 
                "POST", 
                add_movie_data
            )

def test_ratings_endpoints(token):
    """Prueba los endpoints de ratings"""
    print_separator("TEST ENDPOINTS DE RATINGS")
    
    # Obtener ratings del usuario
    response = test_protected_endpoint(token, "ratings")
    
    # Crear/actualizar un rating
    # Primero necesitamos una película existente
    movies_response = requests.get(
        f"{BASE_URL}/movies/",
        headers={"Authorization": f"Token {token}"}
    )
    
    if movies_response.status_code == 200 and movies_response.json():
        first_movie = movies_response.json()[0]
        movie_id = first_movie['id']
        
        new_rating_data = {
            "movieId": movie_id,
            "score": 5
        }
        
        test_protected_endpoint(token, "ratings", "POST", new_rating_data)

def test_comments_endpoints(token):
    """Prueba los endpoints de comentarios"""
    print_separator("TEST ENDPOINTS DE COMENTARIOS")
    
    # Obtener todos los comentarios
    response = test_protected_endpoint(token, "comments")
    
    # Crear un comentario
    # Primero necesitamos una película existente
    movies_response = requests.get(
        f"{BASE_URL}/movies/",
        headers={"Authorization": f"Token {token}"}
    )
    
    if movies_response.status_code == 200 and movies_response.json():
        first_movie = movies_response.json()[0]
        movie_id = first_movie['id']
        
        new_comment_data = {
            "movieId": movie_id,
            "text": "Este es un comentario de prueba desde el script"
        }
        
        test_protected_endpoint(token, "comments", "POST", new_comment_data)

def test_endpoint_sin_token():
    """Prueba endpoints sin token"""
    print_separator("TEST SIN TOKEN")
    
    # Intentar acceder a endpoints protegidos sin token
    endpoints = ["users", "movies", "watchlists", "ratings", "comments"]
    
    for endpoint in endpoints:
        print(f"\nProbando GET /{endpoint}/ sin token")
        response = requests.get(f"{BASE_URL}/{endpoint}/")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ Correctamente protegido (requiere autenticación)")
        elif response.status_code == 200:
            print("⚠ Acceso permitido sin autenticación")
        else:
            print(f"⚠ Status inesperado: {response.status_code}")

def test_token_invalido():
    """Prueba con token inválido"""
    print_separator("TEST TOKEN INVÁLIDO")
    
    token_invalido = "token_invalido_12345"
    headers = {
        "Authorization": f"Token {token_invalido}",
        "Content-Type": "application/json"
    }
    
    print("Probando acceso con token inválido")
    response = requests.get(f"{BASE_URL}/users/me/", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 401:
        print("✓ Correctamente rechazado (token inválido)")
    else:
        print(f"⚠ Status inesperado: {response.status_code}")

def main():
    """Función principal de pruebas"""
    print("="*60)
    print("SCRIPT DE PRUEBAS PARA API DJANGO CON TOKENS")
    print("="*60)
    
    # Verificar que el servidor esté corriendo
    try:
        print("\nVerificando conexión con el servidor...")
        response = requests.get("http://localhost:8000/api/movies/", timeout=5)
        print("✓ Servidor conectado")
    except requests.exceptions.ConnectionError:
        print("✗ Error: No se puede conectar al servidor")
        print("Asegúrate de que el servidor Django esté corriendo:")
        print("  python manage.py runserver")
        sys.exit(1)
    
    # 1. Probar endpoints sin token
    test_endpoint_sin_token()
    
    # 2. Probar con token inválido
    test_token_invalido()
    
    # 3. Probar registro (opcional, comentar si el usuario ya existe)
    # token = test_register()
    # if not token:
    #     print("\n⚠ Registro falló o usuario ya existe, probando login...")
    
    # 4. Probar login con usuario existente
    token = test_login(TEST_USERNAME, TEST_PASSWORD)
    
    if not token:
        print("\n✗ Error: No se pudo obtener token. Verifica credenciales.")
        print(f"Username: {TEST_USERNAME}, Password: {TEST_PASSWORD}")
        sys.exit(1)
    
    print(f"\n✓ Token obtenido: {token[:20]}...")
    
    # 5. Probar endpoints protegidos con el token
    test_users_endpoints(token)
    test_movies_endpoints(token)
    test_watchlists_endpoints(token)
    test_ratings_endpoints(token)
    test_comments_endpoints(token)
    
    # 6. Prueba especial: Obtener y mostrar información del usuario actual
    print_separator("INFORMACIÓN DEL USUARIO ACTUAL")
    headers = {"Authorization": f"Token {token}"}
    response = requests.get(f"{BASE_URL}/users/me/", headers=headers)
    
    if response.status_code == 200:
        user_info = response.json()
        print(f"Usuario autenticado: {user_info['username']}")
        print(f"ID: {user_info['id']}")
    else:
        print("No se pudo obtener información del usuario")
    
    # 7. Resumen
    print_separator("RESUMEN DE PRUEBAS")
    print("✓ Todas las pruebas completadas")
    print(f"✓ Token válido: {token[:20]}...")
    print("\nPara usar el token en otras herramientas:")
    print(f"Authorization: Token {token}")
    print("\nEjemplos curl:")
    print(f'  curl -H "Authorization: Token {token}" http://localhost:8000/api/users/me/')
    print(f'  curl -H "Authorization: Token {token}" http://localhost:8000/api/watchlists/')

if __name__ == "__main__":
    # Asegurarse de que estamos en el directorio correcto
    if not os.path.exists("manage.py"):
        print("Error: Debes ejecutar este script desde el directorio del proyecto Django")
        print("Donde se encuentra manage.py")
        sys.exit(1)
    
    main()