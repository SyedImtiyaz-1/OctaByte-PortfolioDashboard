import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    // Extract the actual stock symbol from NSE:BHARTIARTL format
    const stockSymbol = symbol.split(':')[1] || symbol;
    
    // Try multiple data sources for better reliability
    let peRatio = 0;
    let earnings = 0;
    let source = '';

    // Method 1: Try Google Finance
    try {
      const googleUrl = `https://www.google.com/finance/quote/${stockSymbol}:NSE`;
      const response = await axios.get(googleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });

      const $ = cheerio.load(response.data);
      
      // Try to find P/E Ratio in various possible locations
      const peRatioText = $('div:contains("P/E Ratio"), td:contains("P/E Ratio")').next().text() ||
                         $('[data-attrid*="P/E"], [data-attrid*="pe"]').text() ||
                         $('div:contains("P/E"), span:contains("P/E")').next().text();
      
      if (peRatioText) {
        peRatio = parseFloat(peRatioText.replace(/[^\d.-]/g, '')) || 0;
      }
      
      // Try to find Earnings data
      const earningsText = $('div:contains("Earnings"), td:contains("Earnings")').next().text() ||
                          $('[data-attrid*="earnings"]').text() ||
                          $('div:contains("EPS"), span:contains("EPS")').next().text();
      
      if (earningsText) {
        earnings = parseFloat(earningsText.replace(/[^\d.-]/g, '')) || 0;
      }

      if (peRatio > 0 || earnings > 0) {
        source = 'Google Finance';
      }
    } catch (googleError) {
      console.log('Google Finance failed, trying alternative sources...');
    }

    // Method 2: Try Yahoo Finance for additional data if Google didn't work
    if (peRatio === 0 && earnings === 0) {
      try {
        const yahooUrl = `https://finance.yahoo.com/quote/${stockSymbol}.NS`;
        const response = await axios.get(yahooUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });

        const $ = cheerio.load(response.data);
        
        // Look for P/E and EPS data in Yahoo Finance
        const peText = $('td:contains("P/E Ratio"), span:contains("P/E")').next().text() ||
                      $('[data-test="PE_RATIO"]').text();
        
        const epsText = $('td:contains("EPS"), span:contains("EPS")').next().text() ||
                       $('[data-test="EPS_RATIO"]').text();
        
        if (peText && peRatio === 0) {
          peRatio = parseFloat(peText.replace(/[^\d.-]/g, '')) || 0;
        }
        
        if (epsText && earnings === 0) {
          earnings = parseFloat(epsText.replace(/[^\d.-]/g, '')) || 0;
        }

        if (peRatio > 0 || earnings > 0) {
          source = source ? `${source} + Yahoo Finance` : 'Yahoo Finance';
        }
      } catch (yahooError) {
        console.log('Yahoo Finance also failed...');
      }
    }

    // If we still don't have data, return error instead of generating mock data
    if (peRatio === 0 && earnings === 0) {
      return NextResponse.json({
        error: 'Unable to fetch real-time financial data from any source',
        symbol: stockSymbol,
        message: 'Both Google Finance and Yahoo Finance failed to provide data'
      }, { status: 500 });
    }

    return NextResponse.json({
      symbol: stockSymbol,
      peRatio: Math.round(peRatio * 100) / 100,
      earnings: Math.round(earnings * 100) / 100,
      source: source,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching financial data:', error);
    
    // Return error instead of mock data
    return NextResponse.json({
      error: 'Failed to fetch real-time financial data',
      symbol: symbol?.split(':')[1] || symbol,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
