from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
from .services import evaluate

def home(request):
    return render(request, "text_analysis/home.html")

@csrf_exempt
def analyze_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "POST only"}, status=405)
    data = json.loads(request.body or "{}")
    return JsonResponse(evaluate(data.get("text", "")))
