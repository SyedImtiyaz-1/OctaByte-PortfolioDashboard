# 🚀 8Byte Portfolio Dashboard

A real-time, dynamic portfolio dashboard built with Next.js, TypeScript, and Tailwind CSS that provides live stock tracking and comprehensive portfolio analysis.

## ✨ Features

- **Real-Time Updates**: Live stock data updates every 15 seconds
- **Advanced Search**: Find stocks by name or symbol with smart filtering
- **Comprehensive Filters**: Filter by sector, performance, stage-2, and investment calls
- **Live Data Integration**: Yahoo Finance for CMP, Google Finance for P/E ratios
- **Responsive Design**: Modern, mobile-friendly interface
- **Type Safety**: Full TypeScript implementation

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Data Fetching**: Axios, Cheerio
- **Real-Time Updates**: Custom service with pub/sub pattern
- **Build Tool**: Next.js App Router

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd 8byte

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
8byte/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard page
├── components/             # React components
│   ├── AdvancedSearch.tsx # Search and filter controls
│   ├── Navbar.tsx         # Top navigation
│   ├── RealTimeStockDashboard.tsx # Main dashboard
│   └── StockDetailModal.tsx # Stock detail view
├── services/               # Business logic
│   ├── portfolioService.ts # Portfolio data management
│   └── realTimeStockService.ts # Real-time data service
├── utils/                  # Utility functions
│   └── portfolioCalculations.ts # Calculation helpers
├── public/                 # Static assets
│   └── data/              # Portfolio data
└── package.json            # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Yahoo Finance API key
NEXT_PUBLIC_YAHOO_FINANCE_API_KEY=your_api_key_here
```

### Data Source
The dashboard uses a hybrid data approach:
- **Base Data**: Static portfolio data from `public/data/data.json`
- **Live Updates**: Real-time data from Yahoo Finance and Google Finance APIs

## 📊 Dashboard Features

### Portfolio Overview
- Total stocks count
- Total investment value
- Current portfolio value
- Overall gain/loss

### Stock Management
- Individual stock cards with live data
- Real-time CMP updates
- Gain/loss calculations
- Performance indicators

### Advanced Filtering
- **Sector-based**: Financial, Tech, Consumer, Power, Green, Chemical, Insurance, Exit
- **Performance**: Gainers, Losers, Break-even
- **Stage-2**: Investment stage filtering
- **Abhishek's Call**: Investment recommendations
- **Price Range**: Multiple price brackets

### Search Functionality
- Search by company name or symbol
- Inclusive search (finds partial matches)
- Real-time results

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🔍 API Endpoints

- `/api/yahoo-finance` - Yahoo Finance data
- `/api/google-finance` - Google Finance data

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support or questions, please open an issue in the repository.

---

**Built with ❤️ by the 8Byte Team**

