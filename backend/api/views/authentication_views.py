from django.contrib.auth import authenticate
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.shortcuts import render, redirect
from django.middleware.csrf import get_token
from django.contrib import messages

from api.models import UserDashboardPreferences


@api_view(['POST', 'GET'])
def login(request):
    if request.method == "GET":
        return render(request, "login.html")
    elif request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        user = authenticate(request, username=email, password=password)

        if user is not None:
            auth_login(request, user)
            return redirect("covertest")
        else:
            print("User does not exist")
            messages.error(request, "Invalid credentials")
            return redirect("login")
    return redirect("covertest")

@api_view(['POST'])
def register(request):
    email = request.POST.get("email")
    password = request.POST.get("password")

    print(email)
    print(password)

    if User.objects.filter(username=email).exists():
        messages.error(request, "Username already exists")
        return redirect("login")
    user = User.objects.create_user(email = email, username=email, password=password)
    user.save()
    return redirect("login")

def logout(request):
    auth_logout(request)
    messages.success(request, "You have been logged out.")
    return redirect("covertest")

def fetch_csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})

def set_user_preferences(request):
    if request.method == "GET":
        return JsonResponse({"preferences": []})
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({"preferences": []})

    if not user.user_permissions.get(codename="can_access_user_dashboard"):
        return JsonResponse({"preferences": []})

    user_preferences = request.POST.get("preferences")
    if not user_preferences:
        return JsonResponse({"preferences": []})

    user_dashboard_pref, _ = UserDashboardPreferences.objects.get_or_create(user=user)
    user_dashboard_pref.preferences = user_preferences


