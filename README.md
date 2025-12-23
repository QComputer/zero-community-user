# Zero Community User Frontend

A React-based frontend for the Zero Community user interface, built with Vite and TypeScript.

## Project Structure

- `src/` - Main source code
- `src/components/` - React components
- `src/pages/` - Page components
- `src/services/` - API services and utilities
- `src/hooks/` - Custom React hooks
- `src/i18n/` - Internationalization support

## Technologies

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- TanStack Query
- React Router
- i18next

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment

This project is configured for deployment on Cloudflare Pages with the following configuration:

- **Build command**: `npm run build`
- **Build directory**: `dist`
- **Framework**: React/Vite

The project includes:
- `wrangler.toml` - Cloudflare Workers configuration
- Proper build configuration for static site deployment
- Optimized production build with gzip compression

## Features

- Multi-language support (English/Persian)
- Responsive design with Tailwind CSS
- Modern React patterns with hooks
- Type-safe development with TypeScript
- Efficient state management with TanStack Query
- Accessible UI components with Radix UI