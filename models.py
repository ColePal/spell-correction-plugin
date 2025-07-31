from django.db import models
from datetime import date, time, datetime
from django.utils import timezone

class User(models.Model):
    username = models.CharField(max_length=6, null=False,primary_key=True)
    first_name = models.CharField(max_length=50, null=False)
    last_name = models.CharField(max_length=50, null=False)
    email = models.CharField(max_length=50)

class Query(models.Model):
    id = models.AutoField(primary_key=True)
    sent_message = models.CharField(max_length=1000)
    received_message = models.CharField(max_length=(1000))

class CorrectedWord(models.Model):
    id = models.AutoField(primary_key=True)
    query_id = models.ForeignKey(Query, on_delete=models.CASCADE)
    incorrect_word = models.CharField(max_length=30)
    corrected_word = models.CharField(max_length=30)

class WordFeedback(models.Model):
    id = models.AutoField(primary_key=True)
    word_id = models.ForeignKey(CorrectedWord, on_delete=models.CASCADE)
    accepted = models.BooleanField()
    feedback = models.CharField(max_length=200, null=False)


