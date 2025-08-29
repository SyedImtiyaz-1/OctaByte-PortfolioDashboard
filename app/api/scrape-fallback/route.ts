import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    console.log(`Scraping fallback data for symbol: ${symbol}`);
    
    // Try to get data from Screener.in (most reliable for Indian stocks)
    const screenerData = await scrapeScreenerIn(symbol);
    if (screenerData) {
      console.log(`Successfully scraped from Screener.in: ${symbol} = ${screenerData.currentPrice}`);
      return NextResponse.json({
        ...screenerData,
        source: 'Screener.in (Scraped)',
        lastUpdated: new Date().toISOString()
      });
    }

    console.error(`Scraping failed for symbol: ${symbol}`);
    return NextResponse.json({ 
      error: 'Unable to scrape data',
      symbol,
      message: 'Please check the symbol or try again later'
    }, { status: 500 });

  } catch (error) {
    console.error(`Error scraping data for ${symbol}:`, error);
    return NextResponse.json({ 
      error: 'Internal server error',
      symbol,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Scrape Screener.in (Most reliable for Indian stocks)
async function scrapeScreenerIn(symbol: string) {
  try {
    const screenerSymbol = symbol.replace('.NS', '').replace('.BO', '');
    const url = `https://www.screener.in/company/${screenerSymbol}/`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) return null;

    const html = await response.text();
    
    // Extract current price using regex (simpler than cheerio)
    const priceMatch = html.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i);
    if (!priceMatch) return null;
    
    const currentPrice = parseFloat(priceMatch[1].replace(/[^\d.-]/g, ''));
    if (isNaN(currentPrice)) return null;
    
    // Extract change if available
    const changeMatch = html.match(/<span[^>]*class="[^"]*change[^"]*"[^>]*>([^<]+)<\/span>/i);
    const change = changeMatch ? parseFloat(changeMatch[1].replace(/[^\d.-]/g, '')) : 0;
    
    return {
      symbol,
      currentPrice,
      previousClose: currentPrice - change,
      change,
      changePercent: change > 0 ? (change / (currentPrice - change)) * 100 : 0,
      volume: 0,
      marketCap: 0,
      peRatio: 0,
      earningsPerShare: 0,
      dividendYield: 0
    };
  } catch (error) {
    console.error(`Screener.in scraping error for ${symbol}:`, error);
  }
  return null;
}
