# ------------------------------------------------------------
# CORN DISEASE DETECTION - PYTORCH TRAINING SCRIPT (Run in Colab)
# ------------------------------------------------------------
# 1. Upload your dataset to Google Drive or Colab.
#    Expected structure:
#    dataset/
#       train/
#           Blight/
#           Common_Rust/
#           Gray_Leaf_Spot/
#           Healthy/
#       val/ (optional, or use split)
# ------------------------------------------------------------

import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
import os
import copy
import time

# CONFIGURATION
DATA_DIR = 'dataset' # Update this via code or drag-drop folder
NUM_CLASSES = 4
BATCH_SIZE = 32
EPOCHS = 10
DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

def train_model():
    print(f"Training on {DEVICE}...")

    # Data Augmentation & Normalization
    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    # Load Data (Assuming 'train' and 'val' folders exist, otherwise auto-split)
    # If you only have one folder, we can split it.
    
    # Simple check for structure
    if os.path.exists(os.path.join(DATA_DIR, 'train')):
        image_datasets = {x: datasets.ImageFolder(os.path.join(DATA_DIR, x), data_transforms[x]) for x in ['train', 'val']}
    else:
        # Fallback: Load all from DATA_DIR and split
        if not os.path.exists(DATA_DIR):
             print(f"ERROR: {DATA_DIR} not found. Please upload your dataset.")
             return None, []
             
        full_dataset = datasets.ImageFolder(DATA_DIR, data_transforms['train'])
        train_size = int(0.8 * len(full_dataset))
        val_size = len(full_dataset) - train_size
        train_dataset, val_dataset = torch.utils.data.random_split(full_dataset, [train_size, val_size])
        image_datasets = {'train': train_dataset, 'val': val_dataset}
        
    dataloaders = {x: torch.utils.data.DataLoader(image_datasets[x], batch_size=BATCH_SIZE, shuffle=True, num_workers=2) for x in ['train', 'val']}
    dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'val']}
    class_names = image_datasets['train'].classes if hasattr(image_datasets['train'], 'classes') else image_datasets['train'].dataset.classes
    
    print(f"Classes: {class_names}")

    # Model: ResNet18
    model = models.resnet18(pretrained=True)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, NUM_CLASSES)
    
    model = model.to(DEVICE)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=0.001, momentum=0.9)

    # Training Loop
    best_model_wts = copy.deepcopy(model.state_dict())
    best_acc = 0.0

    for epoch in range(EPOCHS):
        print(f'Epoch {epoch}/{EPOCHS - 1}')
        print('-' * 10)

        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(DEVICE)
                labels = labels.to(DEVICE)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_model_wts = copy.deepcopy(model.state_dict())

        print()

    print(f'Best val Acc: {best_acc:4f}')

    # Load best weights
    model.load_state_dict(best_model_wts)
    return model, class_names

if __name__ == '__main__':
    # Instructions to user
    print("Ensure you have a dataset folder ready.")
    try:
        model, classes = train_model()
        if model:
            # SAVE MODEL
            torch.save(model.state_dict(), 'corn_disease_model.pth')
            print("Model saved as 'corn_disease_model.pth'")
            print(f"Class mapping: {classes}")
            
            from google.colab import files
            try:
                files.download('corn_disease_model.pth')
            except:
                print("Download manual check")
        
    except Exception as e:
        print(f"Training failed: {e}")
