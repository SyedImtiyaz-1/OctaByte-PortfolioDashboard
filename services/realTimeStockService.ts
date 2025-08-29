export interface LiveStockData {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  earningsPerShare: number;
  dividendYield: number;
  lastUpdated: Date;
}

export interface HybridStockData {
  // Base data from Excel
  baseData: {
    No: number | null;
    Particulars: string | null;
    'Purchase Price': number | null;
    Qty: number | null;
    Investment: number | null;
    'Portfolio (%)': number | null;
    'NSE/BSE': string | number | null;
    'Market Cap': number | null;
    'P/E (TTM)': number | null;
    'Latest Earnings': number | null;
    'Core Fundamentals': number | null;
    'EBITDA\n(TTM)': number | null;
    'EBITDA (%)': number | null;
    PAT: number | null;
    'PAT (%)': number | null;
    'CFO (March 24)': number | null;
    'CFO \n(5 years)': number | null;
    'Free Cash Flow\n(5 years)': number | null;
    'Debt to Equity': number | null;
    'Book Value': number | null;
    'Growth (3 years': number | null;
    EBITDA: number | null;
    Profit: number | null;
    'Market\nCap': number | null;
    'Price to Sales': number | null;
    'CFO to EBITDA': number | null;
    'CFO to PAT': number | null;
    'Price to book': number | null;
    'Stage-2': string | null;
    'Sale price': number | null;
    Abhishek: string | null;
  };
  
  // Real-time data from APIs
  liveData: LiveStockData | null;
  
  // Calculated real-time values
  calculated: {
    currentCMP: number;
    presentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    portfolioPercentage: number;
  };
}

export class RealTimeStockService {
  private static instance: RealTimeStockService;
  private apiKey: string = '';
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: ((data: HybridStockData[]) => void)[] = [];

  private constructor() {
    // Initialize with API keys if available
    this.apiKey = process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY || '';
  }

  public static getInstance(): RealTimeStockService {
    if (!RealTimeStockService.instance) {
      RealTimeStockService.instance = new RealTimeStockService();
    }
    return RealTimeStockService.instance;
  }

  // Subscribe to real-time updates
  subscribe(callback: (data: HybridStockData[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers(data: HybridStockData[]) {
    this.subscribers.forEach(callback => callback(data));
  }

  // Fetch live data from Yahoo Finance
  async fetchYahooFinanceData(symbol: string): Promise<LiveStockData | null> {
    try {
      // Using Yahoo Finance API (free tier)
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
      
      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.statusText}`);
      }

      const data = await response.json();
      const quote = data.chart.result[0].meta;
      const indicators = data.chart.result[0].indicators.quote[0];

      return {
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
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Error fetching Yahoo Finance data for ${symbol}:`, error);
      return null;
    }
  }

  // Fetch live data from Google Finance (alternative)
  async fetchGoogleFinanceData(symbol: string): Promise<LiveStockData | null> {
    try {
      // Using Alpha Vantage as Google Finance alternative (free tier)
      const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        console.warn('Alpha Vantage API key not found, using Yahoo Finance fallback');
        return this.fetchYahooFinanceData(symbol);
      }

      const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.statusText}`);
      }

      const data = await response.json();
      const quote = data['Global Quote'];

      if (!quote || !quote['05. price']) {
        throw new Error('Invalid data from Alpha Vantage');
      }

      return {
        symbol,
        currentPrice: parseFloat(quote['05. price']),
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        marketCap: 0, // Not provided by Alpha Vantage
        peRatio: 0, // Not provided by Alpha Vantage
        earningsPerShare: 0, // Not provided by Alpha Vantage
        dividendYield: 0, // Not provided by Alpha Vantage
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Error fetching Google Finance/Alpha Vantage data for ${symbol}:`, error);
      return null;
    }
  }

  // Get symbol mapping for Indian stocks
  private getSymbolMapping(nseBseSymbol: string | number): string {
    const symbolMap: { [key: string]: string } = {
      'HDFCBANK': 'HDFCBANK.NS', // NSE suffix
      'BAJFINANCE': 'BAJFINANCE.NS',
      'ICICIBANK': 'ICICIBANK.NS',
      'DMART': 'DMART.NS',
      'TATACONSUM': 'TATACONSUM.NS',
      'TATAPOWER': 'TATAPOWER.NS',
      'AFFLE': 'AFFLE.NS',
      'LTIM': 'LTIM.NS',
      'KPITTECH': 'KPITTECH.NS',
      'TATATECH': 'TATATECH.NS',
      'TCS': 'TCS.NS',
      'INFY': 'INFY.NS',
      'NESTLEIND': 'NESTLEIND.NS',
      'ASTRAL': 'ASTRAL.NS',
      'POLYCAB': 'POLYCAB.NS',
      'CLEAN': 'CLEAN.NS',
      'SBLIFE': 'SBILIFE.NS'
    };

    const symbol = nseBseSymbol.toString();
    return symbolMap[symbol] || `${symbol}.NS`; // Default to NSE suffix
  }

  // Create hybrid data combining Excel base + live API data
  createHybridData(baseData: any): HybridStockData {
    const liveData = null; // Will be populated by API calls
    
    return {
      baseData,
      liveData,
      calculated: {
        currentCMP: baseData.CMP || 0,
        presentValue: (baseData.CMP || 0) * (baseData.Qty || 0),
        gainLoss: ((baseData.CMP || 0) * (baseData.Qty || 0)) - (baseData.Investment || 0),
        gainLossPercent: baseData.Investment ? 
          ((((baseData.CMP || 0) * (baseData.Qty || 0)) - baseData.Investment) / baseData.Investment) * 100 : 0,
        portfolioPercentage: baseData['Portfolio (%)'] || 0
      }
    };
  }

  // Update hybrid data with live API data
  updateHybridData(hybridData: HybridStockData, liveData: LiveStockData): HybridStockData {
    const currentCMP = liveData.currentPrice;
    const qty = hybridData.baseData.Qty || 0;
    const investment = hybridData.baseData.Investment || 0;
    
    return {
      ...hybridData,
      liveData,
      calculated: {
        currentCMP,
        presentValue: currentCMP * qty,
        gainLoss: (currentCMP * qty) - investment,
        gainLossPercent: investment > 0 ? ((currentCMP * qty) - investment) / investment * 100 : 0,
        portfolioPercentage: hybridData.calculated.portfolioPercentage
      }
    };
  }

  // Start real-time updates every 15 seconds
  startRealTimeUpdates(hybridData: HybridStockData[]) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      const updatedData = await Promise.all(
        hybridData.map(async (stock) => {
          const symbol = stock.baseData['NSE/BSE'];
          if (!symbol) return stock;

          try {
            // Try Yahoo Finance first, fallback to Alpha Vantage
            let liveData = await this.fetchYahooFinanceData(this.getSymbolMapping(symbol));
            
            if (!liveData) {
              liveData = await this.fetchGoogleFinanceData(this.getSymbolMapping(symbol));
            }

            if (liveData) {
              return this.updateHybridData(stock, liveData);
            }
          } catch (error) {
            console.error(`Error updating ${symbol}:`, error);
          }

          return stock;
        })
      );

      this.notifySubscribers(updatedData);
    }, 15000); // 15 seconds
  }

  // Stop real-time updates
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Get portfolio summary from hybrid data
  getPortfolioSummary(hybridData: HybridStockData[]) {
    const totalInvestment = hybridData.reduce((sum, stock) => 
      sum + (stock.baseData.Investment || 0), 0
    );
    
    const totalPresentValue = hybridData.reduce((sum, stock) => 
      sum + stock.calculated.presentValue, 0
    );
    
    const totalGainLoss = totalPresentValue - totalInvestment;
    const totalGainLossPercent = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

    return {
      totalStocks: hybridData.length,
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      totalGainLossPercent,
      lastUpdated: new Date()
    };
  }
}

export default RealTimeStockService;
