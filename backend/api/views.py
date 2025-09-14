import random
import re

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json

from regex import regex

from .services import evaluate
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render, redirect
from django.shortcuts import render
from .models import CorrectionRequest, CorrectedWord
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, logout as auth_logout

from . import lmspell
from .sentencebuffer import sentencebuffer
from django.contrib import messages
from .services import evaluate
import uuid


sentenceBufferMap = {}

def covertest_page(request):
    return render(request, 'covertest.html')

def cover_page(request):
    return render(request, 'TestingSlice.html')

def dashboard_page(request):
    return render(request, 'dashboard.html')

@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'project': 'spell-correction-plugin'})

@api_view(['GET'])
def experimental(request):
    return render(request, 'TestingSlice.html')

@api_view(['POST'])
def spell_check(request):
    # get data from request
    text = request.data.get('text', '')
    lang = request.data.get('language', 'en')
    sentence_index = request.data.get('sentenceIndex', 0)
    index = request.data.get('index', 0)
    print(request.data)


    #The user cannot use spell correction unless logged in.
    if not request.user.is_authenticated:
        response_data = {
            'incorrectText': text,
            'correctText': text,
            'index': index,
            'correctedWords': list(),
        }
        print("Not Logged in")
        return Response(response_data, status=status.HTTP_401_UNAUTHORIZED)
    session_key = request.session.session_key
    if session_key not in sentenceBufferMap:
        sentenceBufferMap.update({session_key: sentencebuffer()})

    if not text:
        print("Text is required")
        sentenceBufferMap.get(session_key).flush()
        return Response(
            {'error': 'Text is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    #sentence buffer stores unterminated strings to concat to the text,
    #providing the language model with contextful strings.

    buffer_index = sentenceBufferMap.get(session_key).get_minimum_index(index, sentence_index)
    query = sentenceBufferMap.get(session_key).get_query(index, text)

    lmspellOutput = lmspell.spellcorrect_text(query)

    #print(sentenceBufferMap[session_key])


    corrected_words = list()
    if (lmspellOutput["success"] == False):
        return Response()
    for correction in lmspellOutput["differences"]:
        corrected_word = {
            'original': correction["original"],
            'corrected': correction["corrected"],
            'startIndex': correction["original_index"],
            'type': correction["type"]
        }
        corrected_words.append(corrected_word)

    response_data = {
        'incorrectText': lmspellOutput["original"],
        'correctText': lmspellOutput["corrected"],
        'index': buffer_index,
        'correctedWords': corrected_words,
    }
    print(response_data)
    return Response(response_data)

def home(request):
    return render(request,"home.html")

def analyze(request):
    if request.method != "POST":
        return JsonResponse({"detail": "POST only"}, status=405)
    data = json.loads(request.body or "{}")
    return JsonResponse(evaluate(data.get("text", "")))

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
            return redirect("experimental")
        else:
            print("User does not exist")
            messages.error(request, "Invalid credentials")
            return redirect("login")
    return redirect("experimental")

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
    return redirect("login")

def logout(request):
    auth_logout(request)
    messages.success(request, "You have been logged out.")
    return redirect("experimental")

def accept_change(request):
    if request.method != "POST":
        return JsonResponse({"detail": "POST only"}, status=405)
    data = json.loads(request.body or "{}")

