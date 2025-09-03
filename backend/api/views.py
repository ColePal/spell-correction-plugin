import random

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
from .models import CorrectionRequest, CorrectedWord, User, Session
from . import lmspell
from .services import evaluate
import uuid

@api_view(['POST'])
def spell_check(request):
    """Main spell check endpoint that uses LMSpell"""
    # Get data from request
    text = request.data.get('text', '')
    lang = request.data.get('language', 'en')
    inputId = request.data.get('inputId', '')
    index = request.data.get('index', 0)

    if not text:
        return Response(
            {'error': 'Text is required'},
            status=status.HTTP_400_BAD_REQUEST
        )


def covertest_page(request):
    return render(request, 'covertest.html')

def cover_page(request):
    return render(request, 'TestingSlice.html')


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'project': 'spell-correction-plugin'})

@api_view(['GET'])
def experimental(request):
    return render(request, 'TestingSlice.html')

"""Session and user data is for server side only. We only need to send
highlighting and spell correction information back to the user"""

@api_view(['POST'])
def spell_check(request):
    # get data from request
    text = request.data.get('text', '')
    lang = request.data.get('language', 'en')
    inputId = request.data.get('inputId', '')
    index = request.data.get('index', '')

    if not text:
        return Response(
            {'error': 'Text is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # create a test user and session
    """
    test_user, created = User.objects.get_or_create(
        username='test01',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com'
        }
    )

    # Create session
    session = Session.objects.create(
        id=str(uuid.uuid4())[:20],
        user_id=test_user
    )

    # will connect to LMSpell later
    corrected = text  # just echo for testing

    # store correction request
    correction_request = CorrectionRequest.objects.create(
        session_id=session,
        original_text=text,
        received_text=corrected,
        language=lang
    )
    """


    lmspellOutput = lmspell.correct_text(text)

    print(lmspellOutput)

    corrected_words = list()
    if (lmspellOutput["success"] == False):
        return Response()
    for correction in lmspellOutput["differences"]:
        corrected_word = {
            'original': correction["original"],
            'corrected': correction["corrected"],
            'originalIndex': correction["original_index"],
            'correctedIndex': correction["corrected_index"],
            'type': correction["type"]
        }
        corrected_words.append(corrected_word)

    response_data = {
        'incorrectText': lmspellOutput["incorrectText"],
        'correctText': lmspellOutput["correctText"],
        'index': index,
        'inputId': inputId,
        'correctedWords': corrected_words,
    }

    return Response(response_data)

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
from .services import evaluate

def home(request):
    return render(request,"home.html")

@csrf_exempt
def analyze(request):
    if request.method != "POST":
        return JsonResponse({"detail": "POST only"}, status=405)
    data = json.loads(request.body or "{}")
    return JsonResponse(evaluate(data.get("text", "")))

