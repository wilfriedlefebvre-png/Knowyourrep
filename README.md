# Know Your Reps

A Progressive Web App (PWA) to find and learn about your representatives - federal, state, and local officials across the United States.

## Features

- 🗺️ **Interactive US Map** - Click on any state to filter representatives
- 🔍 **Search Functionality** - Search by name or office
- 🏛️ **Multi-Level Filtering** - Filter by level (Federal, State, Local), party, state, and city
- 📱 **Progressive Web App** - Install on your phone and use offline
- 📊 **Comprehensive Data** - Access information about:
  - Federal officials (President, Vice President, Senators, Representatives)
  - State officials (Governors, Lt. Governors, Attorneys General, Secretaries of State)
  - Local officials (Mayors)
- 📖 **Wikipedia Integration** - View Wikipedia information for each representative

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/wilfriedlefebvre-png/Knowyourrep.git
cd Knowyourrep
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Installation on Mobile

### Android
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen" or "Install app"

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **react-usa-map** - Interactive US map
- **PWA** - Progressive Web App support

## Data

The app uses local JSON data stored in `public/politicians.json` containing information about:
- Federal representatives (updated for 2025)
- State representatives from all 50 states
- Mayors from major US cities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Repository

[https://github.com/wilfriedlefebvre-png/Knowyourrep](https://github.com/wilfriedlefebvre-png/Knowyourrep)
