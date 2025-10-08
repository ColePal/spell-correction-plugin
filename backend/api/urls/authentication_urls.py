from django.urls import path
from ..views import authentication_views as views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('logout_extension/', views.logout_extension, name='logout_extension'),
    path('register/', views.register, name='register'),
    path('fetch-csrf',views.fetch_csrf_token, name='fetch_csrf'),
    path('async-login/', views.async_login, name='async_login'),
    path('async-register/', views.async_register, name='async_register'),
    path('set-user-preferences/', views.set_user_preferences, name='set_user_preferences'),
]
