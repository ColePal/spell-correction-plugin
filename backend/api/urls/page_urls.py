from django.urls import path
from ..views import page_views as views

urlpatterns = [
    path('dashboard/', views.dashboard_page, name='dashboard'),
    path('cover/', views.cover_page, name='cover'),
    path('experimental/', views.experimental, name='experimental'),
    path('dashboard/', views.dashboard_page, name='dashboard'),
    path('contact/', views.contact_view, name='contact'),
    path('success/', views.success_view, name='success'),
    path('', views.cover_page, name='covertest'),
]