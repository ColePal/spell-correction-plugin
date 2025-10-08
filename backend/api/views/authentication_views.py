import json

from django.contrib.auth import authenticate
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.contrib.auth.models import User, Group
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.shortcuts import render, redirect
from django.middleware.csrf import get_token
from django.contrib import messages

from api.models import UserDashboardPreferences


@api_view(['POST'])
def async_login(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"status": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")

    print("email,Password" ,email, password)

    user = authenticate(request, username=email, password=password)

    if user is not None:
        auth_login(request, user)
        return JsonResponse({"status": "ok"})
    else:
        print("User does not exist")

        return JsonResponse({"status": "Invalid credentials"})

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
def async_register(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"status": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")
    first_name = data.get("first_name")
    last_name = data.get("last_name")

    print(email)
    print(password)

    if User.objects.filter(username=email).exists():
        return JsonResponse({"status": "Username already exists"}, status=400)
    user = User.objects.create_user(email = email, username=email, password=password, first_name=first_name, last_name=last_name)

    auth_user_group = Group.objects.get(name="Authenticated Users")
    user.groups.add(auth_user_group)
    user.save()

    return JsonResponse({"status": "Success"}, status=200)
@api_view(['POST'])
def register(request):
    email = request.POST.get("email")
    password = request.POST.get("password")
    first_name = request.POST.get("first_name")
    last_name = request.POST.get("last_name")

    print(email)
    print(password)

    if User.objects.filter(username=email).exists():
        messages.error(request, "Username already exists")
        return redirect("login")
    user = User.objects.create_user(email = email, username=email, password=password, first_name=first_name, last_name=last_name)

    auth_user_group = Group.objects.get(name="Authenticated Users")
    user.groups.add(auth_user_group)
    user.save()

    return redirect("login")

def logout(request):
    auth_logout(request)
    messages.success(request, "You have been logged out.")
    return redirect("covertest")

def logout_extension(request):
    auth_logout(request)
    return JsonResponse({'extension logged out': True})

def fetch_csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})

def set_user_preferences(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST method only"}, status=400)



    user = request.user

    if not user.has_perm("auth.can_access_user_dashboard"):
        return JsonResponse({"error": "User does not have permission to access this page"}, status=403)

    try:
        data = json.loads(request.body)
        user_preferences = data.get("preferences", [])
        if not isinstance(user_preferences, list):
            return JsonResponse({"error": "Preferences must be a list"}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    user_dashboard_pref, _ = UserDashboardPreferences.objects.get_or_create(user=user)
    user_dashboard_pref.preferences = user_preferences
    user_dashboard_pref.save()
    return JsonResponse({"success": True})


