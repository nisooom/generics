import numpy as np
import json
import os

# Attribute names
attributes = [
    "ldr",
    "eng",
    "len",
    "sent",
    "plag",
]

# Initialize weights randomly
weights = np.random.rand(len(attributes))

# Learning rate
learning_rate = 0.01

# Load sample data from JSON file
json_path = os.path.join(os.path.dirname(__file__), "../api-testing/flipkart_detailed_reviews.json")
with open(json_path, "r") as f:
    raw_data = json.load(f)

# Convert JSON data to sample_data list of dicts with required attributes


print(raw_data)

sample_data = []

for i in raw_data:
    sample_data.append(i["score"])
# Example input data

print(sample_data)


def compute_score(features, weights):
    feature_vector = np.array([features[attr] for attr in attributes])
    return np.dot(weights, feature_vector)

def normalize_weights(weights, features):
    feature_vector = np.array([features[attr] for attr in attributes])
    score = np.dot(weights, feature_vector)
    
    # Normalize score to not exceed 1.0
    if score > 1.0:
        scale_factor = 1.0 / score
        weights = weights * scale_factor
        print(f"🔧 Normalized weights (scaled by {scale_factor:.4f}) to keep score <= 1")
    elif score < 0:
        print("⚠️ Score < 0 detected. Clipping to zero.")
        weights = np.zeros_like(weights)
    
    return weights

def manual_gradient_descent_step(data_point, weights, learning_rate):
    feature_vector = np.array([data_point[attr] for attr in attributes])
    
    current_score = np.dot(weights, feature_vector)
    print(f"\nCurrent weighted score: {current_score:.4f}")
    print(f"Data Point: {data_point=}")

    feedback = input("Was the score GOOD or BAD? (good/bad/exit): ").strip().lower()
    
    if feedback == 'exit':
        return weights, False

    direction = 1 if feedback == 'y' else -1
    weights += direction * learning_rate * feature_vector

    # Normalize after update
    weights = normalize_weights(weights, data_point)
    
    return weights, True

def train(weights, data, learning_rate):
    keep_training = True
    step = 0
    while keep_training:
        for data_point in data:
            print(f"\n--- Step {step+1} ---")
            weights, keep_training = manual_gradient_descent_step(data_point, weights, learning_rate)
            step += 1
            if not keep_training:
                break
    return weights

# Run training
final_weights = train(weights, sample_data, learning_rate)

# print("\n✅ Final weights after manual training and normalization:")
for attr, weight in zip(attributes, final_weights):
    print(f"{attr}: {weight:.4f}")
