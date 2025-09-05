# text_analysis/urls.py
from django.urls import path
from .views import home, analyze_view,language_detect

urlpatterns = [
    path("", home, name="home"),
    path("api/analyze/", analyze_view, name="analyze"),

    path("api/language/", language_detect, name="analyze"),
]
