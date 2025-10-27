import os
import praw
from datetime import datetime
from textblob import TextBlob
import pandas as pd
from dotenv import load_dotenv
from pathlib import Path

ENV_PATH =(Path(__file__).parent / "../config/.env").resolve()

load_dotenv(ENV_PATH)

# ----------------------------------------
# Reddit API setup
# ----------------------------------------
def get_reddit_client():
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = os.getenv("REDDIT_USER_AGENT", "StockVision/1.0")

    if not client_id or not client_secret:
        raise ValueError("❌ Missing Reddit API credentials. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.")

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
        username=os.getenv("REDDIT_USERNAME"),
        password=os.getenv("REDDIT_PASSWORD"),
    )
    return reddit


# ----------------------------------------
# Sentiment analysis of Reddit posts
# ----------------------------------------
def analyze_sentiment(text):
    """Return sentiment label and polarity score."""
    blob = TextBlob(text)
    score = blob.sentiment.polarity
    if score > 0.05:
        label = "positive"
    elif score < -0.05:
        label = "negative"
    else:
        label = "neutral"
    return label, score


# ----------------------------------------
# Main function to fetch Reddit sentiment
# ----------------------------------------
def fetch_reddit_sentiment(ticker, limit=100, time_filter="day"):
    """
    Fetch Reddit posts mentioning a stock ticker and analyze sentiment.
    """
    reddit = get_reddit_client()
    subreddits = ["stocks", "investing", "wallstreetbets", "StockMarket", "options"]
    query = f"{ticker} OR ${ticker}"

    posts = []
    positive, negative, neutral, total_score = 0, 0, 0, 0

    for sub in subreddits:
        for post in reddit.subreddit(sub).search(query, time_filter=time_filter, limit=limit):
            text = f"{post.title} {post.selftext or ''}"
            sentiment_label, sentiment_score = analyze_sentiment(text)

            if sentiment_label == "positive":
                positive += 1
            elif sentiment_label == "negative":
                negative += 1
            else:
                neutral += 1

            total_score += sentiment_score

            posts.append({
                "title": post.title,
                "url": f"https://reddit.com{post.permalink}",
                "subreddit": sub,
                "score": post.score,
                "num_comments": post.num_comments,
                "created": datetime.fromtimestamp(post.created_utc),
                "sentiment": sentiment_label,
                "sentiment_score": sentiment_score,
            })

    total = len(posts)
    avg_score = total_score / total if total > 0 else 0

    sentiment_summary = {
        "ticker": ticker,
        "mentions": total,
        "positive_pct": (positive / total * 100) if total else 0,
        "neutral_pct": (neutral / total * 100) if total else 0,
        "negative_pct": (negative / total * 100) if total else 0,
        "average_sentiment": avg_score,
        "top_posts": sorted(posts, key=lambda x: x["score"], reverse=True)[:10],
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    return sentiment_summary


# ----------------------------------------
# Example run
# ----------------------------------------
if __name__ == "__main__":
    ticker = "IBM"
    data = fetch_reddit_sentiment(ticker)
    print(f"Reddit sentiment for {ticker}:")
    print(pd.DataFrame(data["top_posts"])[["subreddit", "score", "sentiment"]].head())
    print({
        "Positive": data["positive_pct"],
        "Neutral": data["neutral_pct"],
        "Negative": data["negative_pct"],
        "Average": data["average_sentiment"]
    })
