# ClearComment

A React application for managing and moderating Facebook comments with analytics and automated rules.

## Project Setup

This project was initialized with Vite (React template) and includes the following dependencies:

### Core Dependencies
- **React** - UI library
- **React Router DOM** - Client-side routing
- **Firebase** - Backend services (Authentication, Firestore, etc.)
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Beautiful hand-crafted SVG icons
- **Chart.js** & **React Chart.js 2** - Data visualization

## Folder Structure

```
/src
  /components
    /ui          # Reusable UI components
    /tables      # Table components for data display
  /pages
    /login       # Login page
    /dashboard
      /analytics # Analytics dashboard
      /comments  # Comments moderation
      /rules     # Automation rules management
```

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Technologies

- **Vite** - Fast build tool and dev server
- **React 19** - Latest React version
- **Tailwind CSS 4** - Latest Tailwind version
- **Firebase 12** - Latest Firebase SDK
- **React Router DOM 7** - Latest React Router

## Next Steps

1. Configure Firebase (create `src/firebase.js` with your Firebase config)
2. Set up routing in `src/App.jsx`
3. Implement authentication flow
4. Build out the dashboard components
5. Integrate Facebook API for comment moderation
