from django.contrib import admin
from .models import SpellCorrection

# Register your models here.

class SpellCorrectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'original_text', 'language', 'created_at']
    list_filter = ['language', 'created_at']
    search_fields = ['original_text', 'corrected_text']
    ordering = ['-created_at']  # newest first

admin.site.register(SpellCorrection, SpellCorrectionAdmin)