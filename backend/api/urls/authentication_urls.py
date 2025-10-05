from django.urls import path
from ..views import authentication_views as views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('register/', views.register, name='register'),
    path('fetch_csrf',views.fetch_csrf_token, name='fetch_csrf'),
]
