export interface StockData {
  No: number | null;
  Particulars: string | null;
  'Purchase Price': number | null;
  Qty: number | null;
  Investment: number | null;
  'Portfolio (%)': number | null;
  'NSE/BSE': string | number | null;
  CMP: number | null;
  'Present value': number | null;
  'Gain/Loss': number | null;
  'Gain/Loss\n(%)': number | null;
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
}

export interface PortfolioData {
  metadata: {
    source_file: string;
    total_rows: number;
    total_columns: number;
    columns: string[];
  };
  data: StockData[];
}

export class PortfolioService {
  private static instance: PortfolioService;
  private portfolioData: PortfolioData | null = null;

  private constructor() {}

  public static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  async loadPortfolioData(): Promise<PortfolioData> {
    if (this.portfolioData) {
      return this.portfolioData;
    }

    try {
      const response = await fetch('/data/data.json');
      if (!response.ok) {
        throw new Error(`Failed to load portfolio data: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.portfolioData = data;
      return data;
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      throw error;
    }
  }

  getIndividualStocks(): StockData[] {
    if (!this.portfolioData) {
      return [];
    }

    return this.portfolioData.data.filter(stock => 
      stock.No !== null && 
      stock.Particulars && 
      stock.Particulars !== 'Particulars' &&
      !stock.Particulars.includes('Sector') &&
      stock.Particulars !== null
    );
  }

  getStockBySymbol(symbol: string): StockData | undefined {
    const stocks = this.getIndividualStocks();
    return stocks.find(stock => 
      stock['NSE/BSE']?.toString().toLowerCase() === symbol.toLowerCase()
    );
  }

  getStockByName(name: string): StockData | undefined {
    const stocks = this.getIndividualStocks();
    return stocks.find(stock => 
      stock.Particulars?.toLowerCase().includes(name.toLowerCase())
    );
  }

  getStocksBySector(sectorName: string): StockData[] {
    // This would need to be implemented based on your sector mapping
    // For now, returning all stocks
    return this.getIndividualStocks();
  }

  getPortfolioSummary() {
    const stocks = this.getIndividualStocks();
    
    const totalInvestment = stocks.reduce((sum, stock) => 
      sum + (stock.Investment || 0), 0
    );
    
    const totalPresentValue = stocks.reduce((sum, stock) => 
      sum + (stock['Present value'] || 0), 0
    );
    
    const totalGainLoss = totalPresentValue - totalInvestment;
    const totalGainLossPercent = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

    return {
      totalStocks: stocks.length,
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      totalGainLossPercent
    };
  }

  // Simulate real-time price updates
  simulatePriceUpdate(stock: StockData): StockData {
    if (!stock.CMP) return stock;

    // Simulate small price movements (±2%)
    const changePercent = (Math.random() - 0.5) * 0.04;
    const newCMP = stock.CMP * (1 + changePercent);
    const newPresentValue = newCMP * (stock.Qty || 0);
    const newGainLoss = newPresentValue - (stock.Investment || 0);
    const newGainLossPercent = (stock.Investment || 0) > 0 ? 
      (newGainLoss / (stock.Investment || 0)) * 100 : 0;

    return {
      ...stock,
      CMP: parseFloat(newCMP.toFixed(2)),
      'Present value': parseFloat(newPresentValue.toFixed(2)),
      'Gain/Loss': parseFloat(newGainLoss.toFixed(2)),
      'Gain/Loss\n(%)': parseFloat(newGainLossPercent.toFixed(2))
    };
  }
}

export default PortfolioService;
