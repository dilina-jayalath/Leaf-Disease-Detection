# ==========================================
# PLANT DISEASE MODEL TRAINING SCRIPT
# ==========================================
# Copy and paste the code blocks below into a Google Colab notebook (https://colab.research.google.com/)

# ------------------------------------------
# STEP 1: SETUP & INSTALLATION
# ------------------------------------------
# Run this cell to install necessary libraries (usually pre-installed in Colab, but good to be safe)
!pip install tensorflow numpy matplotlib

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os
import matplotlib.pyplot as plt

print("TensorFlow Version:", tf.__version__)

# ------------------------------------------
# STEP 2: DATASET PREPARATION
# ------------------------------------------
# You need a dataset. The most popular is "PlantVillage".
# Option A: Upload your own 'dataset' folder to Colab files.
# Option B (Recommended): Download directly from Kaggle API.

# --- UNCOMMENT BELOW IF USING KAGGLE ---
# !pip install kaggle
# !mkdir ~/.kaggle
# !cp kaggle.json ~/.kaggle/  # You need to upload your kaggle.json api key first
# !chmod 600 ~/.kaggle/kaggle.json
# !kaggle datasets download -d emmarex/plantdisease
# !unzip plantdisease.zip

# For this script, we assume a folder structure:
# /dataset
#    /train
#       /Potato___Early_blight
#       /Potato___Late_blight
#       /Potato___healthy
#    /val (optional, or use split)

# Define paths (Adjust these to match your Colab folder structure)
# If you used the command above, it might be inside a 'plantvillage' folder
DATA_DIR = 'plantvillage/PlantVillage' 
IMG_SIZE = 224
BATCH_SIZE = 32

# ------------------------------------------
# STEP 3: DATA LOADING & AUGMENTATION
# ------------------------------------------
# We use ImageDataGenerator to load images and add variety (augmentation) to improve training

train_datagen = ImageDataGenerator(
    rescale=1./255,             # Normalize pixel values to 0-1
    rotation_range=20,          # Random rotation
    width_shift_range=0.2,      # Random horizontal shift
    height_shift_range=0.2,     # Random vertical shift
    shear_range=0.2,            # Random shear 
    zoom_range=0.2,             # Random zoom
    horizontal_flip=True,       # Random flip
    validation_split=0.2        # Use 20% of data for validation
)

# Load Training Data
train_generator = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

# Load Validation Data
validation_generator = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

# Print Label Mapping (Save this! You need it for the Backend)
print("Class Indices:", train_generator.class_indices)

# ------------------------------------------
# STEP 4: MODEL SKELETON (TRANSFER LEARNING)
# ------------------------------------------
# We use MobileNetV2. It's fast, small, and accurate - perfect for web/mobile apps.

# Load the base model, excluding the top (classification) layers
base_model = MobileNetV2(
    weights='imagenet', 
    include_top=False, 
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

# Freeze the base model (so we don't ruin the pre-trained weights)
base_model.trainable = False

# Add our own classification layers on top
model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2),  # Prevents overfitting
    layers.Dense(128, activation='relu'),
    layers.Dense(train_generator.num_classes, activation='softmax') # Output layer
])

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ------------------------------------------
# STEP 5: TRAINING
# ------------------------------------------
EPOCHS = 10 # Start with 10. Increase to 20-30 for better results.

history = model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples // BATCH_SIZE,
    validation_data=validation_generator,
    validation_steps=validation_generator.samples // BATCH_SIZE,
    epochs=EPOCHS
)

# ------------------------------------------
# STEP 6: FINE TUNING (OPTIONAL - FOR HIGHER ACCURACY)
# ------------------------------------------
# Unfreeze the last few layers of the base model
base_model.trainable = True
# Fine-tune from this layer onwards
# MobileNetV2 has about 155 layers. 
# 100 was safe, but we need more adaptation now since we are stuck.
fine_tune_at = 50 
for layer in base_model.layers[:fine_tune_at]:
  layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-4),  # Increased from 1e-5 to 1e-4 because 1e-5 was too slow
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

fine_tune_epochs = 5
total_epochs = EPOCHS + fine_tune_epochs

history_fine = model.fit(
    train_generator,
    epochs=total_epochs,
    initial_epoch=history.epoch[-1],
    validation_data=validation_generator
)

# ------------------------------------------
# STEP 7: EVALUATION & CONFUSION MATRIX
# ------------------------------------------
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns

# Generate predictions for the validation set
# (We need to reset the generator to ensure order matches)
validation_generator.reset()
predictions = model.predict(validation_generator)
predicted_classes = np.argmax(predictions, axis=1)

# Get true labels
true_classes = validation_generator.classes
class_labels = list(validation_generator.class_indices.keys())

# Print Report
print(classification_report(true_classes, predicted_classes, target_names=class_labels))

# Plot Confusion Matrix
cm = confusion_matrix(true_classes, predicted_classes)
plt.figure(figsize=(10, 10))
sns.heatmap(cm, annot=True, fmt='d', xticklabels=class_labels, yticklabels=class_labels, cmap='Blues')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.title('Confusion Matrix')
plt.show()

# ------------------------------------------
# STEP 8: EXPORT MODEL
# ------------------------------------------
# Save as .h5 (Legacy format - most compatible for cross-version inference)
model.save('plant_disease_model.h5')
print("Model saved as plant_disease_model.h5")

# Download the file to your computer
from google.colab import files
files.download('plant_disease_model.h5')
