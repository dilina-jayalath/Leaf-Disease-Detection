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

# Placeholder for PredictionHistory if needed later
class PredictionHistory(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    # Add other fields as necessary
