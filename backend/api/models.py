from django.db import models
from datetime import date, time, datetime

from django.db.models.deletion import SET_NULL
from django.db.models.fields.related import ForeignKey
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session


class CorrectionRequest(models.Model):
    # keeping track of corrections
    id = models.AutoField(primary_key=True)
    #session_id = models.ForeignKey(Session, on_delete=models.CASCADE)
    user = ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    session_id = models.CharField(max_length=40)
    original_text = models.TextField()
    received_text = models.TextField()
    language = models.CharField(max_length=5, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    word_count = models.IntegerField(default=0)
    #created_at = models.CharField()

    def __str__(self):
        preview = self.original_text[:50]
        if len(self.original_text) > 50:
            preview += "..."
        return preview
    class Meta:
        permissions = [
            ("create_correction_request", "Can store user text in database")
        ]
        indexes = [
            models.Index(fields=["user", "created_at"]),
        ]

class CorrectedWord(models.Model):
    id = models.AutoField(primary_key=True)
    query_id = models.ForeignKey(CorrectionRequest, on_delete=models.CASCADE,related_name='corrected_words')
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

    def __str__(self):
        if self.word_id:  # self.word is the CorrectedWord instance
            original = self.word_id.incorrect_word
            corrected = self.word_id.corrected_word
            preview = f"{original[:20]} -> {corrected[:20]}"

            if len(original) + len(corrected) > 40:
                preview += "..."
            return preview
        return "No word linked"


class UserDashboardPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="dashboard_preferences")
    preferences = models.JSONField(default=list)


