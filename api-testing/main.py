from sel_multithread import rank_reviews_by_score
from fastapi import FastAPI
from model_test import get_sentiment 
import requests
import time
from upstash_redis import Redis
import urllib.parse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re


redis = Redis.from_env()

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
    return parsed_url.path.strip("/").split("/")[0]

def get_product_url(url):
    parsed_url = urllib.parse.urlparse(url)
    split_path = parsed_url.path.strip("/").split("/")
    review_url = parsed_url.scheme + "://" + parsed_url.netloc + "/" + split_path[0] + "/product-reviews/" + split_path[-1]
    return review_url

def cache(url, data):
    id = get_uuid(url)
    redis.set(id, data)


@app.get("/")
def main():
    return {"health": "ok"}


@app.post("/say_hello")
async def say_hello(request: NameRequest):
    return {"message": f"Hello, {request.name}!"}


@app.post("/analyse")
def analyze(url: NameRequest):
    url = url.name
    n = 25

    if res := redis.get(get_uuid(url)):
        return res          


    # print(get_product_url(url))
    start = time.time()
    reviews = rank_reviews_by_score(url)
    end = time.time()

    list_of_texts = [i["review"] for i in reviews]

    # print(reviews)

    # print("LIST OF TEXTX", list_of_texts)
    sentiment_time = time.time()
    sentiment_scores = get_sentiment(list_of_texts)
    sentiment_end_time = time.time()
    print(f"Sentiment Analysis done in {sentiment_end_time - sentiment_time:.2f}")
    for review, score in zip(reviews, sentiment_scores):
        review["sentiment"] = score
    summary = infer_llm(reviews=list_of_texts[:n])

    summary = summary["content"]

    summary = re.sub(r'[^a-zA-Z0-9\s]', '', summary)
    summary = re.sub(r'\s+', ' ', summary.strip())


    print(f"Time taken : {end - start:.2f}")

    data = { "Reviews" : reviews, "Summary" : summary }
    cache(url, data)


    return data
        

def infer_llm(reviews):
    try:

        llm_url = "http://192.168.6.94:11030/completion"
        headers = {
            "Content-Type": "application/json"
        }

        data = {
            "prompt": f"""
    You are given a list of user reviews. Read them all carefully and generate a concise, balanced summary that captures the overall sentiment, common themes, notable pros and cons, and any frequently mentioned issues or praises. Use clear language and aim to reflect the general consensus as well as any strong outliers DO NOT USE POINTS JUST GIVE ME A SMALL PARA FOR IT.
    Reviews GIVE ME A 150 WORD REVIEW: {reviews}
    """,
            "n_predict": 256
        }

        response = requests.post(llm_url, headers=headers, json=data)
        return response.json()
    except:
        return ""