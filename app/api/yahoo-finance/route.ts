import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    // Extract the actual stock symbol from NSE:BHARTIARTL format
    const stockSymbol = symbol.split(':')[1] || symbol;
    
    // Add .NS suffix for Indian stocks if not already present
    const fullSymbol = stockSymbol.includes('.') ? stockSymbol : `${stockSymbol}.NS`;
    
    // Use direct Yahoo Finance API (more reliable than yahoo-finance2 package)
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}`;
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data available for this symbol');
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    
    const price = meta.regularMarketPrice || 0;
    const previousClose = meta.previousClose || meta.regularMarketPrice || 0;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return NextResponse.json({
      symbol: stockSymbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: meta.regularMarketVolume || 0,
      marketCap: meta.marketCap || 0,
      high: meta.regularMarketDayHigh || 0,
      low: meta.regularMarketDayLow || 0,
      open: meta.regularMarketOpen || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    
    // Return error instead of mock data
    return NextResponse.json({ 
      error: 'Failed to fetch real-time data from Yahoo Finance',
      details: error instanceof Error ? error.message : 'Unknown error',
      symbol: symbol?.split(':')[1] || symbol
    }, { status: 500 });
  }
}
