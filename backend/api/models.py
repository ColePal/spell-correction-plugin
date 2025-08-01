from django.db import models

# Create your models here.

class SpellCorrection(models.Model):
    # keeping track of corrections
    original_text = models.TextField()
    corrected_text = models.TextField()
    language = models.CharField(max_length=10, default='en')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        preview = self.original_text[:50]
        if len(self.original_text) > 50:
            preview += "..."
        return preview