from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from pydantic import BaseModel

import urllib.parse
import requests
from upstash_redis import Redis

import time
import re

from model_test import get_sentiment, fake_check
from similar_items import find_similar_items
from sel_multithread import get_reviews_formatted, rank_reviews_by_score

import os
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()


redis = Redis.from_env()

class URLRequest(BaseModel):
    url: str
    
app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],          # Allow all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],          # Allow all headers
)


def get_uuid(url):
    parsed_url = urllib.parse.urlparse(url)
    return parsed_url.path.strip("/").split("/")[0]

def cache(url, data):
    id = get_uuid(url)
    redis.set(id, data)


@app.get("/")
def main():
    return {"health": "ok"}

@app.post("/analyse")
# @limiter.limit("5/minute")
async def analyze(request: Request, url: URLRequest):
    url = url.url
    top_n = 25

    start = time.time()
    search_param = re.sub(r"-", "+", get_uuid(url))

    if res := redis.get(get_uuid(url)):
        return res

    total_start_time = time.time()
    reviews, num = get_reviews_formatted(url)
    similar_items = find_similar_items(search_param)
    end = time.time()

    list_of_texts = [i["review"] for i in reviews]

    # print("LIST OF TEXTX", list_of_texts)
    user_score = [i["final_score"] for i in reviews]
    user_mean_score = sum(user_score) / len(user_score)
    user_sentiment = ""

    # Classify user_mean_score into sentiment category
    if 0 <= user_mean_score < 0.05:
        user_sentiment = "very negative"
    elif 0.05 <= user_mean_score < 0.15:
        user_sentiment = "negative"
    elif 0.15 <= user_mean_score < 0.35:
        user_sentiment = "neutral"
    elif 0.35 <= user_mean_score < 0.75:
        user_sentiment = "positive"
    else:
        user_sentiment = "very positive"

    sentiment_time = time.time()
    sentiment_scores = get_sentiment(list_of_texts)
    sentiment_mean_score = sum(sentiment_scores) / len(sentiment_scores)
    sentiment_end_time = time.time()
    print(f"Sentiment Analysis done in {sentiment_end_time - sentiment_time:.2f}")

    fake_scores = fake_check(list_of_texts)
    num_fakes = sum([1 for i in fake_scores if i > 0.5]) / len(reviews)

    for review, score in zip(reviews, sentiment_scores):
        review["sentiment"] = score

    summary = infer_llm(reviews=list_of_texts[:top_n])
    summary = summary["content"]

    summary = re.sub(r'[^a-zA-Z0-9\s\.]', '', summary)
    summary = re.sub(r'\s+', ' ', summary.strip())

    total_stop_time = time.time()
    print(f"Time taken : {total_stop_time - total_start_time:.2f}")

    print(f"Time taken : {end - start:.2f}")

    data = { 
        "Reviews" : reviews,
        "Summary" : summary,
        "ReviewsScraped": num,
        "SentimentScore" : (round(sentiment_mean_score * 100)),
        "UserSentiment": user_sentiment,
        "FakeRatio": round(num_fakes * 100),
        "RelatedItems": similar_items,
        }
    cache(url, data)

    return data


def get_similar(url: URLRequest):
    return find_similar_items(get_uuid(url))


def infer_llm(reviews):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            "You are given a list of user reviews. Read them all carefully and generate a concise, balanced summary that captures the overall sentiment, common themes, notable pros and cons, and any frequently mentioned issues or praises. Use clear language and aim to reflect the general consensus as well as any strong outliers. DO NOT USE POINTS. "
            "GIVE ME A 150 WORD REVIEW: " + str(reviews)
        )
        response = model.generate_content(prompt)
        return {"content": response.text}
    except Exception as e:
        print(f"Gemini API error: {e}")
        return {"content": ""}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
