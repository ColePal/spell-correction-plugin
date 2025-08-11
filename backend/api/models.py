from django.db import models
from datetime import date, time, datetime
from django.utils import timezone


#PLACEHOLDER UNTIL I WORK OUT DJANGOS SESSION AND USER SYSTEM
class User(models.Model):
    username = models.CharField(max_length=6, null=False,primary_key=True)
    first_name = models.CharField(max_length=50, null=False)
    last_name = models.CharField(max_length=50, null=False)
    email = models.EmailField(max_length=50)

class Session(models.Model):
    id = models.CharField(max_length=20, null=False, primary_key=True)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)

# Create your models here.

class CorrectionRequest(models.Model):
    # keeping track of corrections
    id = models.AutoField(primary_key=True)
    session_id = models.ForeignKey(Session, on_delete=models.CASCADE)
    original_text = models.TextField()
    received_text = models.TextField()
    language = models.CharField(max_length=5, default='en')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        preview = self.original_text[:50]
        if len(self.original_text) > 50:
            preview += "..."
        return preview

class CorrectedWord(models.Model):
    id = models.AutoField(primary_key=True)
    query_id = models.ForeignKey(CorrectionRequest, on_delete=models.CASCADE)
    incorrect_word = models.CharField(max_length=30)
    corrected_word = models.CharField(max_length=30)

    def __str__(self):
        preview = self.corrected_word[:20]
        if len(self.corrected_word) > 20:
            preview += "..."
        return preview

class WordFeedback(models.Model):
    id = models.AutoField(primary_key=True)
    word_id = models.ForeignKey(CorrectedWord, on_delete=models.CASCADE)
    accepted = models.BooleanField()
    feedback = models.CharField(max_length=200, null=False)

