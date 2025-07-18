
import torch
from torch.nn.utils.rnn import pad_sequence
from nltk.tokenize import word_tokenize
import json

check_fake_model = torch.jit.load("../ml/check-fake.pt", map_location="cpu") 
sentiment_model = torch.jit.load("../ml/sentiment-analysis.pt", map_location="cpu")
print("Loaded torch model")
vocab = json.load(open("../ml/vocab.json"))
print(f"Loaded vocabulary ({len(vocab)} tokens)")


def encode_text(text):
    return torch.tensor([
        vocab.get(tk, 1)
        for tk in word_tokenize(text)
    ])

def fake_check(reviews):
    batched_tensors = pad_sequence([
        encode_text(text)
        for text in reviews
    ], batch_first=True)

    check_fake_model.eval()
    with torch.no_grad():
        output = check_fake_model(batched_tensors)
    return output.numpy().tolist()

def get_sentiment(reviews):
    batched_tensors = pad_sequence([
        encode_text(text)
        for text in reviews
    ], batch_first=True)

    sentiment_model.eval()
    with torch.no_grad():
        output = sentiment_model(batched_tensors)

    return output.numpy().tolist()


if __name__ == "__main__":
    reviews = [
    "i really enjoyed this product, the quality is great",
    "labubu dolls are so bad at their job",
    "i liked the delivery guy, send him again",
    "good frame quality, wished it was cheaper though, great buy"
    ]
    for text, score in zip(reviews, get_sentiment(reviews)):
        print(text, score)
