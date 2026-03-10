# Frontend Application

A React frontend application built with Vite, Tailwind CSS, shadcn/ui, React Hook Form, Zod, and TanStack Query.

## Tech Stack

- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - UI components (Button, Input, Dialog)
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **TanStack Query** - Data fetching and caching

## Project Structure

```
src
├── components
│   └── ui
│       ├── button.tsx
│       ├── input.tsx
│       └── dialog.tsx
├── features
│   └── users
│       ├── components
│       │   ├── UserTable.tsx
│       │   └── UserForm.tsx
│       ├── queries
│       │   └── getUsers.ts
│       ├── mutations
│       │   └── createUser.ts
│       ├── hooks
│       │   └── useUsers.ts
│       ├── keys.ts
│       └── index.ts
├── lib
│   └── utils.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

The Users feature demonstrates:
- **Queries**: Fetching users from JSONPlaceholder API via TanStack Query
- **Mutations**: Creating users with cache invalidation
- **Forms**: User creation form with React Hook Form + Zod validation
- **UI**: Table display and modal dialog for adding users
