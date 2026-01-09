from django.contrib import admin
from .models import Disease, PredictionHistory

@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'symptoms', 'causes')
    list_filter = ('name',)

admin.site.register(PredictionHistory)

