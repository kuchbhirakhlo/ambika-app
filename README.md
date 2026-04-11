# Ambika Empire - Inventory & Order Management System

A modern, progressive web application for managing inventory, orders, and business operations for Ambika Empire.

## 🚀 Features

- **Real-time Dashboard**: Live updates for orders, inventory, and analytics
- **Inventory Management**: Track stock levels with automatic updates
- **Order Processing**: Create and manage orders with inventory validation
- **Multi-user Support**: Admin and employee role-based access
- **PWA Ready**: Installable web app with offline capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Real-time**: Socket.io for live updates
- **Authentication**: JWT tokens
- **PWA**: Next-PWA for service worker and app manifest

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or cloud)
- Git

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ambika-app
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with admin credentials or create an admin account

## 📦 Production Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npx vercel --prod
   ```

2. **Set Environment Variables in Vercel**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add the following variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure random string (generate with `openssl rand -base64 32`)

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secure-random-string-here` |
| `MONGODB_DB` | Database name (optional) | `ambika` |
| `PORT` | Server port (optional) | `3000` |

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication
│   └── layout.tsx        # Root layout
├── components/            # Reusable components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility libraries
├── models/               # MongoDB models
└── types/                # TypeScript types
```

## 🔐 Authentication

The application supports two user roles:

- **Admin**: Full access to all features
- **Employee**: Limited access based on permissions

### Creating Admin Account

Use the `/api/admin/create-admin` endpoint to create the first admin account:

```bash
curl -X POST http://localhost:3000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "securepassword",
    "name": "Administrator",
    "email": "admin@ambika.com"
  }'
```

## 🗄️ Database Models

- **Users**: Admin and employee accounts
- **Products**: Inventory items
- **Orders**: Customer orders
- **Estimates**: Sales estimates
- **Inventory**: Stock levels
- **Customers**: Customer information
- **Agents**: Sales agents
- **Suppliers**: Supplier information

## 🔄 Real-time Features

The application includes real-time updates using Socket.io:

- Live dashboard updates
- Inventory synchronization
- Order status changes
- Cross-tab synchronization

## 🐛 Troubleshooting

### Common Issues

1. **Client-side Exception Error**
   - Check browser console for specific errors
   - Ensure all environment variables are set in production
   - Verify MongoDB connection is working

2. **Authentication Issues**
   - Check JWT_SECRET is set correctly
   - Verify token expiration (24 hours default)
   - Clear browser localStorage if needed

3. **Database Connection Errors**
   - Verify MONGODB_URI format
   - Check network connectivity to MongoDB
   - Ensure database user has proper permissions

4. **Build Errors**
   - Clear `.next` cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

### Debug Mode

Set `NODE_ENV=development` for detailed logging in development.

## 📱 Progressive Web App

The application is PWA-ready with:

- Service worker for offline functionality
- App manifest for installation
- Responsive design for all devices
- Fast loading with optimized assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary software for Ambika Empire.

## 📞 Support

For technical support, please contact the development team.
