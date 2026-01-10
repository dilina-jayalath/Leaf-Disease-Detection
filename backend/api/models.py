from django.db import models

class Disease(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    symptoms = models.TextField()
    causes = models.TextField()
    treatment = models.TextField()
    prevention = models.TextField()
    image = models.ImageField(upload_to='disease_images/', blank=True, null=True)

    def __str__(self):
        return self.name

class PredictionHistory(models.Model):
    image = models.ImageField(upload_to='predictions/')
    disease = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, blank=True)
    confidence = models.FloatField(default=0.0)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction at {self.timestamp}"
