const Snoowrap = require('snoowrap');
const Sentiment = require('sentiment');

const sentiment = new Sentiment();

// Cache to avoid hitting Reddit API too often
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Get Reddit client instance
 */
function getRedditClient() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT || 'StockVision/1.0';

  if (!clientId || !clientSecret) {
    throw new Error('Reddit API credentials not configured. Please add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to your .env file.');
  }

  // For script apps, we don't need refreshToken - we'll use password flow
  return new Snoowrap({
    userAgent,
    clientId,
    clientSecret,
    username: process.env.REDDIT_USERNAME || '',
    password: process.env.REDDIT_PASSWORD || ''
  });
}

/**
 * Search Reddit for mentions of a stock ticker
 */
async function getStockMentions(ticker, timeframe = 'day') {
  const cacheKey = `${ticker}-${timeframe}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const reddit = getRedditClient();
    const subreddits = ['stocks', 'investing', 'wallstreetbets', 'StockMarket', 'options'];
    
    // Search across multiple subreddits
    const searchQuery = `${ticker} OR $${ticker}`;
    const results = await reddit.search({
      query: searchQuery,
      subreddit: subreddits.join('+'),
      time: timeframe, // hour, day, week, month, year
      sort: 'relevance',
      limit: 100
    });

    // Process results
    const posts = [];
    let totalScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const post of results) {
      // Analyze sentiment
      const text = `${post.title} ${post.selftext || ''}`;
      const sentimentResult = sentiment.analyze(text);
      
      const sentimentLabel = 
        sentimentResult.score > 0 ? 'positive' :
        sentimentResult.score < 0 ? 'negative' : 'neutral';

      if (sentimentLabel === 'positive') positiveCount++;
      else if (sentimentLabel === 'negative') negativeCount++;
      else neutralCount++;

      totalScore += sentimentResult.score;

      posts.push({
        title: post.title,
        url: `https://reddit.com${post.permalink}`,
        subreddit: post.subreddit.display_name,
        score: post.score,
        numComments: post.num_comments,
        created: new Date(post.created_utc * 1000),
        sentiment: sentimentLabel,
        sentimentScore: sentimentResult.score
      });
    }

    // Sort by score (upvotes)
    posts.sort((a, b) => b.score - a.score);

    const total = posts.length;
    const data = {
      ticker,
      mentions: total,
      sentiment: {
        positive: total > 0 ? (positiveCount / total) * 100 : 0,
        neutral: total > 0 ? (neutralCount / total) * 100 : 0,
        negative: total > 0 ? (negativeCount / total) * 100 : 0,
        averageScore: total > 0 ? totalScore / total : 0
      },
      topPosts: posts.slice(0, 10),
      hypeScore: calculateHypeScore(total, positiveCount, negativeCount, posts),
      timeframe,
      lastUpdated: new Date()
    };

    // Cache the result
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    console.error('Reddit API error:', error);
    throw error;
  }
}

/**
 * Calculate hype score (0-100)
 */
function calculateHypeScore(mentions, positive, negative, posts) {
  if (mentions === 0) return 0;

  // Factors (Updated weights: Mention 30 -> 20, Trend 10 -> 20)
  
  // Mention Score: Max 20 points (down from 30)
  const mentionScore = Math.min((mentions / 50) * 20, 20); // Max 20 points 
  
  // Sentiment Score: Max 40 points (no change)
  const sentimentScore = ((positive - negative) / mentions) * 40; // Max 40 points
  
  // Engagement score based on upvotes and comments (no change)
  const avgEngagement = posts.slice(0, 10).reduce((sum, p) => sum + p.score + p.numComments, 0) / Math.min(posts.length, 10);
  const engagementScore = Math.min((avgEngagement / 100) * 20, 20); // Max 20 points
  
  // Trend score (recent activity): Max 20 points (up from 10)
  // Logic remains: Last 6 hours
  const recentPosts = posts.filter(p => Date.now() - p.created.getTime() < 6 * 60 * 60 * 1000); // Last 6 hours
  const trendScore = Math.min((recentPosts.length / mentions) * 20, 20); // Max 20 points

  const total = mentionScore + sentimentScore + engagementScore + trendScore;
  return Math.max(0, Math.min(100, Math.round(total)));
}

/**
 * Get hype level label
 */
function getHypeLevel(score) {
  if (score >= 80) return { label: '🔥 On Fire!', color: '#ff4444' };
  if (score >= 60) return { label: '🌡️ Hot', color: '#ff8800' };
  if (score >= 40) return { label: '😊 Warm', color: '#ffaa00' };
  if (score >= 20) return { label: '😐 Cool', color: '#4CAF50' };
  return { label: '❄️ Cold', color: '#2196F3' };
}

module.exports = {
  getStockMentions,
  getHypeLevel
};