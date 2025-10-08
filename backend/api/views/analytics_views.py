from django.db.models import Q
from django.utils import timezone
import datetime
from django.db.models.aggregates import Sum, Count
from django.db.models.functions.comparison import Coalesce
from django.db.models.functions.datetime import TruncDate
from django.http import JsonResponse
import json
from django.views.decorators.cache import never_cache
from ..services import all_languages, most_misspelled_word, vocab_richness, calculate_typing_speed, evaluate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..models import CorrectionRequest
from rest_framework.permissions import IsAuthenticated


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@never_cache
def dashboard_languages(request):
    lang_count=list(all_languages(request))
    payload = [
        {"language": lc["detected_language"], "count": lc["count"], "percentage": lc["percentage"]}
        for lc in lang_count
    ]
    return Response({ "languages_all": payload})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@never_cache
def misspelled_word(request):
    top = most_misspelled_word(request)
    return Response({"top": top})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@never_cache
def mistakes_percentage_timeseries(request):
    try:
        days = int(request.GET.get("days", 30))
    except ValueError:
        days = 30
    end = timezone.now().date()
    start = end - datetime.timedelta(days=days)
    user=request.user
    database_query = CorrectionRequest.objects.filter(created_at__date__gte=start, created_at__date__lte=end).filter(user=user)
    data_list  = list(database_query.annotate(day=TruncDate("created_at")).values("day").annotate(words=Coalesce(Sum("word_count"), 0), suggested=Coalesce(Count("corrected_words"), 0),
            accepted=Coalesce( Count("corrected_words",filter=Q(corrected_words__wordfeedback__accepted=True),),0,),).order_by("day"))
    rows = {
        row["day"].isoformat(): {
            "words": int(row["words"] or 0),
             "suggested": int(row["suggested"] or 0),
              "accepted": int(row["accepted"] or 0),
        }
        for row in data_list
    }
    data_list=rows
    labels = []
    suggested_values = []
    accepted_values = []
    dates = start
    data_list=dict(data_list)
    while dates <= end:
     labels.append(dates.isoformat())
     word_count = int(data_list.get(dates.isoformat(),{}).get("words", 0))
     suggested_count = int(data_list.get(dates.isoformat(),{}).get("suggested", 0))
     accepted_count = int(data_list.get(dates.isoformat(), {}).get("accepted", 0))
     suggested_percentage = (100.0 * suggested_count / word_count) if word_count > 0 else 0.0
     accepted_percentage = (100.0 * accepted_count / word_count) if word_count > 0 else 0.0
     suggested_percentage=round(suggested_percentage, 2)
     accepted_percentage=round(accepted_percentage, 2)
     suggested_values.append(suggested_percentage)
     accepted_values.append(accepted_percentage)
     dates += datetime.timedelta(days=1)
    return Response({ "labels": labels,"series": [
        {"label": "Suggested %","user_id": user.id,"username":getattr(user, "username", "You"), "data": suggested_values},
        {"label": "Accepted %", "user_id": user.id, "username": getattr(user, "username", "You"), "data": accepted_values},
    ],"unit": "percent"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@never_cache
def richness(request):
    return Response({"richness":vocab_richness(request)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@never_cache
def typing_speed(request):
    request=request._request
    if not request.session.session_key:
        request.session.save()
    return Response({"speed":calculate_typing_speed(request)})

def analyze(request):
    if request.method != "POST":
        return JsonResponse({"detail": "POST only"}, status=405)
    data = json.loads(request.body or "{}")
    evaluation = evaluate(data.get("text", ""))
    print(evaluation)
    return JsonResponse(evaluation)

