from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('spell-check/', views.spell_check, name='spell_check'),
    path('experimental/', views.experimental, name='experimental'),
    path('analyze/', views.analyze, name='analyze'),
]