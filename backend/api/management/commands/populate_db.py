import json
import os

from django.core.management.base import BaseCommand
import api.models as md
from faker import Faker
import random

from django.core.management import call_command

from spellcorrector.settings import tmpPostgres


class Command(BaseCommand):
    def handle(self, *args, **options):

        print("DATABASE_URL =", os.getenv("DATABASE_URL"))
        print("tmpPostgres =", tmpPostgres)

        fake = Faker()


        #clear database of data
        #call_command('flush', '--noinput')

        md.WordFeedback.objects.all().delete()
        md.CorrectedWord.objects.all().delete()
        md.CorrectionRequest.objects.all().delete()
        md.Session.objects.all().delete()
        md.User.objects.all().delete()

        #create users
        for _ in range(10):
            user = md.User(username=fake.user_name(), first_name=fake.first_name(), last_name=fake.last_name(), email=fake.email())
            user.save()
        #create sessions
        users = md.User.objects.all()
        for _ in range(24):
            session = md.Session(user_id = random.choice(users))
            session.save()
        #read in CorrectionRequests
        with open("api/management/commands/test_data/CorrectionRequest.json", "r") as file:
            correction_requests = json.load(file)
        sessions = md.Session.objects.all()
        for correction_request in correction_requests:
            new_correction_request = md.CorrectionRequest(
                id = correction_request["id"],
                session_id = random.choice(sessions),
                original_text = correction_request["original_text"],
                received_text = correction_request["received_text"],
                language = correction_request["language"],
                created_at = correction_request["created_at"],
            )
            new_correction_request.save()
        #read in CorrectedWords
        with open("api/management/commands/test_data/CorrectedWord.json", "r") as file:
            corrected_words = json.load(file)
        correction_requests = md.CorrectionRequest.objects
        for corrected_word in corrected_words:

            correction_query = correction_requests.filter(original_text__contains=corrected_word["incorrect_word"]).filter(received_text__contains=corrected_word["corrected_word"]).first()

            new_corrected_word = md.CorrectedWord(
                query_id= correction_query,
                incorrect_word = corrected_word["incorrect_word"],
                corrected_word = corrected_word["corrected_word"],
            )
            new_corrected_word.save()

        #read in WordFeedbacks
        with open("api/management/commands/test_data/WordFeedback.json", "r") as file:
            word_feedbacks = json.load(file)

        corrected_words = md.CorrectedWord.objects.all()
        for word_feedback in word_feedbacks:
            new_word_feedback = md.WordFeedback(
                word_id = random.choice(corrected_words),
                accepted = word_feedback["accepted"],
                feedback = word_feedback["feedback"],
            )
            new_word_feedback.save()