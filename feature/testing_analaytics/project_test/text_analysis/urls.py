# text_analysis/urls.py
from django.urls import path
from .views import home, analyze_view

urlpatterns = [
    path("", home, name="home"),
    path("api/analyze/", analyze_view, name="analyze"),
]
