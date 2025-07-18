
import torch
from torch.nn.utils.rnn import pad_sequence
import nltk
nltk.download("punkt", download_dir="nltk-tokenizers")
nltk.download("punkt_tab", download_dir="nltk-tokenizers")
from nltk.tokenize import word_tokenize
import json

sentiment_model = torch.jit.load("sentiment-analysis.pt", map_location="cpu")
print("Loaded torch model")
vocab = json.load(open("vocab.json"))
print(f"Loaded vocabulary ({len(vocab)} tokens)")


reviews = [
    "i really enjoyed this product, the quality is great",
    "labubu dolls are so bad at their job",
    "i liked the delivery guy, send him again",
    "good frame quality, wished it was cheaper though, great buy"
]


def encode_text(text):
    return torch.tensor([
        vocab.get(tk, 1)
        for tk in word_tokenize(text)
    ])


def get_sentiment(reviews):
    batched_tensors = pad_sequence([
        encode_text(text)
        for text in reviews
    ], batch_first=True)

    sentiment_model.eval()
    with torch.no_grad():
        output = sentiment_model(batched_tensors)

    return output.numpy().tolist()


for text, score in zip(reviews, get_sentiment(reviews)):
    print(text, score)
