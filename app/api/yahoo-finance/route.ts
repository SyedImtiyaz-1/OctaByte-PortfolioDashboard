import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    console.log(`Fetching data for symbol: ${symbol}`);
    
    // Method 1: Try Yahoo Finance Chart API
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const yahooResponse = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (yahooResponse.ok) {
      const yahooData = await yahooResponse.json();
      
      if (yahooData.chart && yahooData.chart.result && yahooData.chart.result.length > 0) {
        const quote = yahooData.chart.result[0].meta;
        const indicators = yahooData.chart.result[0].indicators.quote[0];
        
        const result = {
          symbol,
          currentPrice: quote.regularMarketPrice,
          previousClose: quote.previousClose,
          change: quote.regularMarketPrice - quote.previousClose,
          changePercent: ((quote.regularMarketPrice - quote.previousClose) / quote.previousClose) * 100,
          volume: indicators.volume[indicators.volume.length - 1] || 0,
          marketCap: quote.marketCap || 0,
          peRatio: quote.trailingPE || 0,
          earningsPerShare: quote.trailingEps || 0,
          dividendYield: quote.dividendYield || 0,
          lastUpdated: new Date().toISOString(),
          source: 'Yahoo Finance'
        };
        
        console.log(`Successfully fetched from Yahoo Finance: ${symbol} = ${result.currentPrice}`);
        return NextResponse.json(result);
      }
    }

    // Method 2: Try Alpha Vantage as fallback
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (alphaVantageKey) {
      const alphaUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`;
      const alphaResponse = await fetch(alphaUrl);
      
      if (alphaResponse.ok) {
        const alphaData = await alphaResponse.json();
        const quote = alphaData['Global Quote'];
        
        if (quote && quote['05. price']) {
          const result = {
            symbol,
            currentPrice: parseFloat(quote['05. price']),
            previousClose: parseFloat(quote['08. previous close']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume']),
            marketCap: 0,
            peRatio: 0,
            earningsPerShare: 0,
            dividendYield: 0,
            lastUpdated: new Date().toISOString(),
            source: 'Alpha Vantage'
          };
          
          console.log(`Successfully fetched from Alpha Vantage: ${symbol} = ${result.currentPrice}`);
          return NextResponse.json(result);
        }
      }
    }

    // Method 3: Try Yahoo Finance Quote API (different endpoint)
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const quoteResponse = await fetch(quoteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (quoteResponse.ok) {
      const quoteData = await quoteResponse.json();
      
      if (quoteData.quoteResponse && quoteData.quoteResponse.result && quoteData.quoteResponse.result.length > 0) {
        const quote = quoteData.quoteResponse.result[0];
        
        const result = {
          symbol,
          currentPrice: quote.regularMarketPrice,
          previousClose: quote.regularMarketPreviousClose,
          change: quote.regularMarketPrice - quote.regularMarketPreviousClose,
          changePercent: ((quote.regularMarketPrice - quote.regularMarketPreviousClose) / quote.regularMarketPreviousClose) * 100,
          volume: quote.regularMarketVolume || 0,
          marketCap: quote.marketCap || 0,
          peRatio: quote.trailingPE || 0,
          earningsPerShare: quote.trailingEps || 0,
          dividendYield: quote.dividendYield || 0,
          lastUpdated: new Date().toISOString(),
          source: 'Yahoo Finance Quote'
        };
        
        console.log(`Successfully fetched from Yahoo Finance Quote: ${symbol} = ${result.currentPrice}`);
        return NextResponse.json(result);
      }
    }

    console.error(`All API methods failed for symbol: ${symbol}`);
    return NextResponse.json({ 
      error: 'Unable to fetch real-time data from all sources',
      symbol,
      message: 'Please check the symbol or try again later'
    }, { status: 500 });

  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return NextResponse.json({ 
      error: 'Internal server error',
      symbol,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
