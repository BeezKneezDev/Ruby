# Ruby's Achievement Portfolio

A full-stack web application for showcasing achievements and awards across different categories.

## Tech Stack

- **Frontend**: React 19 with Vite
- **Backend**: Node.js with Express
- **Database**: SQLite (better-sqlite3)
- **Authentication**: Session-based with bcrypt
- **Routing**: React Router v7

## Features

### Public Pages
- **Home**: Landing page with hero section
- **About**: Information about Ruby and the achievement categories
- **Achievements**: View all achievement categories
- **Category Pages**: View achievements filtered by category

### Admin Dashboard
- Login system with secure authentication
- Manage achievements (Create, Read, Update, Delete)
- Manage categories (Create, Read, Update, Delete)
- Image support for achievements

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. The project is already set up in this directory

2. Install dependencies (already done):
```bash
npm install
```

### Running the Application

You need to run both the frontend and backend servers:

#### Terminal 1 - Backend Server
```bash
npm run server
```
This starts the Express server on http://localhost:3001

#### Terminal 2 - Frontend Development Server
```bash
npm run dev
```
This starts the Vite dev server on http://localhost:5173

### Default Login Credentials

- **Username**: ruby
- **Password**: ruby123

**Important**: Change these credentials in production!

## Project Structure

```
ruby-achievements/
├── server/
│   ├── db/
│   │   ├── database.js       # Database setup and initialization
│   │   └── achievements.db   # SQLite database (created on first run)
│   └── index.js              # Express server and API routes
├── src/
│   ├── components/
│   │   ├── Layout.jsx        # Main layout with navigation
│   │   └── Layout.css
│   ├── pages/
│   │   ├── Home.jsx          # Landing page
│   │   ├── About.jsx         # About page
│   │   ├── Achievements.jsx  # Categories listing
│   │   ├── CategoryPage.jsx  # Individual category page
│   │   ├── Login.jsx         # Admin login
│   │   └── Dashboard.jsx     # Admin dashboard with CRUD
│   ├── App.jsx               # Main app component with routing
│   └── App.css               # Global styles
└── package.json
```

## API Endpoints

### Public Endpoints
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get category by slug
- `GET /api/achievements` - Get all achievements (optional: ?category_id=X)
- `GET /api/achievements/:id` - Get achievement by ID

### Authentication Endpoints
- `POST /api/login` - Login (requires username, password)
- `POST /api/logout` - Logout
- `GET /api/auth/check` - Check authentication status

### Admin Endpoints (Protected)
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `POST /api/admin/achievements` - Create achievement
- `PUT /api/admin/achievements/:id` - Update achievement
- `DELETE /api/admin/achievements/:id` - Delete achievement

## Default Categories

The database is initialized with three categories:
1. **Academic** - Academic achievements and awards
2. **Sports** - Sports and athletic achievements
3. **Arts** - Creative and artistic achievements

## Using the Dashboard

1. Navigate to http://localhost:5173/login
2. Login with the default credentials
3. Use the dashboard to:
   - Add new achievements with title, description, date, category, and image URL
   - Edit existing achievements
   - Delete achievements
   - Manage categories

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Notes

- The database file (`server/db/achievements.db`) is created automatically on first run
- Image URLs should be publicly accessible URLs (for now)
- Categories have slugs that are used in URLs
- Deleting a category will delete all associated achievements

## Future Enhancements

- File upload for images instead of URLs
- User profile editing
- Password change functionality
- Multiple admin users
- Rich text editor for descriptions
- Search functionality
- Pagination for large datasets
- Dark mode
