from django.urls import path
from ..views import analytics_views as views

urlpatterns = [
    path('dashboard/languages/', views.dashboard_languages, name='dashboard_languages'),
    path('dashboard/misspelled/', views.misspelled_word, name='misspelled_word'),
    path('dashboard/timeseries/mistake-percentage/', views.mistakes_percentage_timeseries,
         name='mistakes_percentage_timeseries'),
    path('dashboard/richness/', views.richness, name='richness'),
    path('dashboard/typing-speed/', views.typing_speed, name='type_speed'),
    path('analyze/', views.analyze, name='analyze'),
]