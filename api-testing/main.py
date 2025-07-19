from sel_multithread import rank_reviews_by_score
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
    n = 25

    search_param = re.sub(r"-", "+", get_uuid(url))

    if res := redis.get(get_uuid(url)):
        return res          


    # print(get_product_url(url))
    start = time.time()
    reviews, num = rank_reviews_by_score(url)
    similar_items = find_similar_items(search_param)
    end = time.time()

    list_of_texts = [i["review"] for i in reviews]

    # print(reviews)

    # print("LIST OF TEXTX", list_of_texts)
    user_score = [i["score"] for i in reviews]
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
    
    summary = infer_llm(reviews=list_of_texts[:n])

    summary = summary["content"]

    summary = re.sub(r'[^a-zA-Z0-9\s\.]', '', summary)
    summary = re.sub(r'\s+', ' ', summary.strip())


    print(f"Time taken : {end - start:.2f}")

    data = { 
        "Reviews" : reviews,
        "Summary" : summary, 
        "ReviewsScraped": num,  
        "SentimentScore" : (round(sentiment_mean_score * 100, 2)), 
        "UserSentiment": user_sentiment, 
        "FakeRatio": num_fakes,
        "RelatedItems": similar_items,
        }
    cache(url, data)

    return data


def get_similar(url: URLRequest):
    return find_similar_items(get_uuid(url))


def infer_llm(reviews):
    try:

        llm_url = "http://192.168.6.94:11030/completion"
        headers = {
            "Content-Type": "application/json"
        }

        data = {
            "prompt": f"""
    You are given a list of user reviews. Read them all carefully and generate a concise, balanced summary that captures the overall sentiment, common themes, notable pros and cons, and any frequently mentioned issues or praises. Use clear language and aim to reflect the general consensus as well as any strong outliers DO NOT USE POINTS.
    Reviews GIVE ME A 150 WORD REVIEW: {reviews}
    """,
            "n_predict": 256
        }

        response = requests.post(llm_url, headers=headers, json=data)
        return response.json()
    except:
        return {"content": ""}