from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('spell-check/', views.spell_check, name='spell_check'),
    path('accept-change/', views.accept_change, name='accept_change'),
    path('fetch-csrf-token/', views.fetch_csrf_token, name='fetch_csrf_token'),
    path('analyze/', views.analyze, name='analyze'),
    path("language/", views.language, name="language"),
    path('dashboard/', views.dashboard_page, name='dashboard'),
    path('dashboard/languages/', views.dashboard_languages, name='dashboard_languages'),
    path('dashboard/misspelled/', views.misspelled_word, name='misspelled_word'),
    path('dashboard/timeseries/mistake-percentage/', views.mistakes_percentage_timeseries,
         name='mistakes_percentage_timeseries'),
     path('dashboard/richness/', views.richness,name='richness'),

]
