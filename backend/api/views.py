from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import SpellCorrection


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'project': 'spellcorrector'})


@api_view(['POST'])
def spell_check(request):
    # get data from request
    text = request.data.get('text', '')
    lang = request.data.get('language', 'en')

    if not text:
        return Response(
            {'error': 'Text is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # placeholder for now - will connect to LMSpell later
    corrected = text  # just echo for testing

    # store in db
    correction_obj = SpellCorrection.objects.create(
        original_text=text,
        corrected_text=corrected,
        language=lang
    )

    response_data = {
        'original': text,
        'corrected': corrected,
        'language': lang,
        'id': correction_obj.id
    }

    return Response(response_data)