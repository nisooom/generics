from sel_multithread import rank_reviews_by_score
from fastapi import FastAPI
from model_test import get_sentiment 
import requests
import time
from upstash_redis import Redis
import urllib.parse

redis = Redis.from_env()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class NameRequest(BaseModel):
    name: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],          # Allow all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],          # Allow all headers
)


def get_uuid(url):

    parsed_url = urllib.parse.urlparse(url)
    parsed_url.path.strip("/").split("/")[0]

def cache(url, data):
    id = get_uuid(url)
    if redis.get(id):
        return
    redis.set(id, data)


@app.get("/")
def main():
    return {"health": "ok"}


@app.post("/say_hello")
async def say_hello(request: NameRequest):
    return {"message": f"Hello, {request.name}!"}


@app.post("/analyse/")
def analyze(url):
    start = time.time()

    if res := redis.get(get_uuid(url)):
        return res          


    reviews = rank_reviews_by_score(url)
    list_of_texts = [i["review"] for i in reviews]
    sentiment_scores = get_sentiment(list_of_texts)
    for review, score in zip(reviews, sentiment_scores):
        review["sentiment"] = score

    summary = infer_llm(reviews=list_of_texts)

    end = time.time()

    print(f"Time taken : {end - start:.2f}")

    data = { "Reviews" : reviews, "Summary" : summary }
    cache(url, data)


    return data
        

def infer_llm(reviews):

    llm_url = "http://192.168.6.94:11030/completion"
    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "prompt": f"""
You are given a list of user reviews. Read them all carefully and generate a concise, balanced summary that captures the overall sentiment, common themes, notable pros and cons, and any frequently mentioned issues or praises. Use clear language and aim to reflect the general consensus as well as any strong outliers.
Reviews: {reviews}
""",
        "n_predict": 196
    }

    response = requests.post(llm_url, headers=headers, json=data)
    return response.json()