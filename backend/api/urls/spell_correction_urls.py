from django.urls import path
from ..views import spell_correction_views as views

urlpatterns = [
    path('spell-check/', views.spell_check, name='spell_check'),
    path('accept-change/', views.accept_change, name='accept_change'),
]