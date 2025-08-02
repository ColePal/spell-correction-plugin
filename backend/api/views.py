from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import CorrectionRequest, CorrectedWord, User, Session
import uuid


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

    # create a test user and session

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

    # just return the response now

    response_data = {
        'original': text,
        'corrected': corrected,
        'language': lang,
        'session_id': session.id,
        'request_id': correction_request.id
    }

    return Response(response_data)