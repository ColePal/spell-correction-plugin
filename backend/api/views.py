import datetime
import random
import re

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json

from regex import regex
from django.middleware.csrf import get_token
from .services import evaluate, language_detection, all_languages, most_misspelled_word
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render, redirect
from django.shortcuts import render
from .models import CorrectionRequest, CorrectedWord, WordFeedback
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from .forms import ContactForm


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

def success_view(request):
    return render(request, 'success.html')

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
    language = request.data.get('language', 'en')
    sentence_index = request.data.get('sentenceIndex', 0)
    index = request.data.get('index', 0)
    premium = request.data.get('premium', False)
    print(request.data)


    #The user cannot use spell correction unless logged in.
    if not request.user.is_authenticated:
        response_data = {
            'incorrectText': text,
            'correctText': text,
            'index': index,
            'correctedWords': list(),
            'identifier': 0
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

    lmspellOutput = lmspell.spell_correction(text=query, language=language, premium=premium)
    #print(sentenceBufferMap[session_key])

    corrected_words = list()
    if (lmspellOutput["success"] == False):
        return Response()
    for correction in lmspellOutput["differences"]:
        corrected_word = {
            'original': correction["original"],
            'corrected': correction["corrected"],
            'startIndex': correction["original_index"],
            'type': correction["type"],
            'identifier': 0
        }
        corrected_words.append(corrected_word)

    #if there is a sentence terminator in query log it to db
    stopper = re.search(r"[.?!](?=[^?.!]*$)", query)
    identifier = 0
    if stopper:
        identifier = int(datetime.datetime.now().timestamp() * 1000)
        correction_record = CorrectionRequest.objects.create(
            session_id=session_key,
            original_text = lmspellOutput["original"],
            received_text = lmspellOutput["corrected"],
            language=language,
            created_at=identifier,
        )
        print("Logging Correction to DB", correction_record)
        correction_record.save()

        print("Logging corrected Words to DB")
        for index, correction in enumerate(corrected_words):
            print("correction", correction)
            corrected_word_record = CorrectedWord.objects.create(
                query_id = correction_record,
                incorrect_word = correction["original"],
                corrected_word = correction["corrected"],
            )
            corrected_word_record.save()
            correction["identifier"] = corrected_word_record.id



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
    user.save()
    return redirect("login")

def logout(request):
    auth_logout(request)
    messages.success(request, "You have been logged out.")
    return redirect("experimental")

@api_view(['POST'])
def accept_change(request):
    word_id = request.data.get("identifier", 0)
    accepted = request.data.get("accepted", True)
    feedback = request.data.get("feedback", "")


    try:
        corrected_word = CorrectedWord.objects.get(id=word_id)
    except CorrectedWord.DoesNotExist:
        print("Word does not exist", word_id)
        return Response(
        {"error": f"CorrectedWord with id {word_id} not found."},
        status = 404
        )

    word_feedback_record = WordFeedback.objects.create(
        word_id = corrected_word,
        accepted = accepted,
        feedback = feedback,
    )

    print("Received Feedback", word_feedback_record)

    word_feedback_record.save()

    return Response(
        {"success": f"CorrectedWord with id {word_id} was found."},
        status=200
    )

def fetch_csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})

def contact_view(request):
    alert_message = None

    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']

            full_message = f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"

            send_mail(
                subject=subject,
                message=full_message,
                from_email=None,
                recipient_list=['spellpalproject@gmail.com'],
            )

            alert_message = "Your message was sent successfully!"
            form = ContactForm()
    else:
        form = ContactForm()

    return render(request, 'contact.html', {'form': form, 'alert_message': alert_message})


@api_view(['POST'])
def language(request):
    text = request.data.get("text", "")
    return Response({"language": language_detection(text)})

@api_view(['GET'])
def dashboard_languages(request):
    lang_count=list(all_languages())
    payload = [
        {"language": lc["detected_language"], "count": lc["count"]}
        for lc in lang_count
    ]
    return Response({ "languages_all": payload})


@api_view(['GET'])
def misspelled_word(request):
    word,totals = most_misspelled_word()
    if word==[]:
        return Response({"word": None, "count": 0,**totals})
    return Response({"word": word[0]["incorrect_word"], "count": word[0]["count"],**totals})


@api_view(['GET'])
def mistakes_percentage_timeseries(request):

    try:
        days = int(request.GET.get("days", 30))
    except ValueError:
        days = 30
    user_id = request.GET.get("user_id")

    end = timezone.now().date()
    start = end - timedelta(days=days)
    qs = CorrectionRequest.objects.filter(created_at__date__gte=start,created_at__date__lte=end)

    if user_id:
        qs = qs.filter(user_id=user_id)

    agg = (qs.annotate(day=TruncDate("created_at")).values("day", "user_id", "user__username").annotate(words=Coalesce(Sum("word_count"), 0),corrections=Coalesce(Count("corrections"), 0),).order_by("day", "user__username"))
    rows = list(agg)
    labels = []
    d = start
    while d <= end:
        labels.append(d.isoformat())
        d += timedelta(days=1)

    users = {}
    by_user_day = {}
    for r in rows:
        uid = r["user_id"]
        uname = r["user__username"] or "Anonymous"
        users.setdefault(uid, {"id": uid, "username": uname})
        by_user_day.setdefault(uid, {})[r["day"].isoformat()] = {"w": int(r["words"] or 0),"c": int(r["corrections"] or 0), }

    series = []
    for uid, meta in users.items():
        vals = []
        daymap = by_user_day.get(uid, {})
        for day in labels:
            w = daymap.get(day, {}).get("w", 0)
            c = daymap.get(day, {}).get("c", 0)
            pct = (100.0 * c / w) if w > 0 else 0.0
            vals.append(round(pct, 2))
        series.append({"user_id": uid, "username": meta["username"], "data": vals})

    return Response({"labels": labels, "series": series, "unit": "percent"})