
from django.contrib import admin
#from .models import User, Session, CorrectionRequest, CorrectedWord, WordFeedback
from .models import CorrectionRequest, CorrectedWord, WordFeedback
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session

# Register your models here.

class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name', 'email']
    search_fields = ['username', 'email']

class SessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_id']
    list_filter = ['user_id']

class CorrectionRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'session_id', 'language', 'created_at']
    list_filter = ['language', 'created_at']
    search_fields = ['original_text', 'received_text']
    ordering = ['-created_at']

class CorrectedWordAdmin(admin.ModelAdmin):
    list_display = ['id', 'query_id', 'incorrect_word', 'corrected_word']
    search_fields = ['incorrect_word', 'corrected_word']

class WordFeedbackAdmin(admin.ModelAdmin):
    list_display = ['id', 'word_id', 'accepted', 'feedback']
    list_filter = ['accepted']

#admin.site.register(User, UserAdmin)
#admin.site.register(Session, SessionAdmin)
admin.site.register(CorrectionRequest, CorrectionRequestAdmin)
admin.site.register(CorrectedWord, CorrectedWordAdmin)
admin.site.register(WordFeedback, WordFeedbackAdmin)