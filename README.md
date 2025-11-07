# Know Your Reps (Offline)

A Next.js web application to view and filter your political representatives offline.

## Features

- Clean, modern UI with Tailwind CSS
- Filter by level (Federal/State/Local)
- Search by state name
- Offline-first design
- Responsive layout

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Data Structure

Representatives are stored in `public/politicians.json` with the following structure:

```json
{
  "level": "federal" | "state" | "local",
  "office": "Office Name",
  "name": "Representative Name",
  "party": "Party Name",
  "state": "State Name",
  "photoUrl": "URL to photo (optional)"
}
```

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
