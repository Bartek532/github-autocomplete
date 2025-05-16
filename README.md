# Github Autocomplete

A responsive, modern GitHub search autocomplete component built with Next.js. Search for GitHub users and repositories with real-time results.

## Tech stack

- **Language**: TypeScript
- **Framework**: Next.js
- **UI**: React, Tailwind CSS
- **Data Fetching**: TanStack React Query
- **Icons**: Lucide React
- **Testing**: Jest, React Testing Library
- **Package Manager**: pnpm

## Available scripts

- `pnpm dev` - Start the development server with Turbopack
- `pnpm build` - Run tests and build the application
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode

## Features

- Real-time search for GitHub users and repositories
- Keyboard navigation support (arrow keys, enter, escape)
- Responsive design
- Accessibility support
- Debounced API calls
- Error handling for API rate limits

## Potential improvements

1. **User experience**

   - Recent searches history
   - Infinite scroll for results
   - Highlight matching text in results
   - Clear search button
   - Displaying most popular results when the query is empty
   - "View all results on GitHub" link
   - Configurable debounce time

2. **Other features**

   - Filtering by result type (Users/Repositories)
   - Support for GitHub search qualifiers
   - Expanded repository information
   - Grouped results by type
   - Keyboard shortcut for focus (Cmd/Ctrl + K)
   - Custom result item rendering

3. **Performance**

   - Virtualized lists for better performance with large result sets
   - Prefetching popular results
   - Progressive loading of repository details

4. **Tech**
   - Sophisticated CI/CD workflow
   - Implement Storybook for component documentation
   - Implement code coverage artifacts uploading

## Getting started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start the development server: `pnpm dev`
4. Open [http://localhost:3000](http://localhost:3000) with your browser
