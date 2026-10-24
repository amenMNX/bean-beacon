# Bean Beacon - Deployment Guide

Complete guide to deploying Bean Beacon to production.

## Table of Contents
1. [Frontend Deployment](#frontend-deployment)
2. [Backend Deployment](#backend-deployment)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Post-Deployment Checklist](#post-deployment-checklist)

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Why Vercel:**
- Optimized for Vite applications
- Instant deployments
- Free tier with generous limits
- Built-in analytics

**Steps:**

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/bean-beacon.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select GitHub repository
   - Choose `bean-beacon-app-main` as root directory

3. **Configure environment variables:**
   - Add `VITE_API_URL` = `https://your-backend-url.com/api`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Option 2: Netlify

1. **Build the project:**
   ```bash
   cd bean-beacon-app-main
   npm run build
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variable: `VITE_API_URL`

3. **Deploy and enjoy!**

### Option 3: Self-Hosted

1. **Build frontend:**
   ```bash
   npm run build
   ```

2. **Serve with Nginx:**
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;
     
     root /var/www/bean-beacon-app/dist;
     index index.html;
     
     location / {
       try_files $uri /index.html;
     }
     
     location /api/ {
       proxy_pass http://backend-server:3000;
     }
   }
   ```

3. **Enable HTTPS with Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## Backend Deployment

### Option 1: Render

**Steps:**

1. **Push to GitHub** (same as frontend)

2. **Create Render account:**
   - Go to [render.com](https://render.com)
   - Sign in with GitHub

3. **Create new Web Service:**
   - Click "New +" → "Web Service"
   - Select GitHub repository
   - Choose `bean-beacon-backend` as root directory
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Select "Free" plan (or paid for better performance)

4. **Add environment variables:**
   Under "Environment":
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/bean-beacon
   JWT_SECRET = (generate long random string)
   JWT_EXPIRE = 7d
   PORT = 3000
   NODE_ENV = production
   FRONTEND_URL = https://your-frontend-domain.com
   OVERPASS_API_URL = https://overpass-api.de/api/interpreter
   NOMINATIM_API_URL = https://nominatim.openstreetmap.org
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically deploy

### Option 2: Railway

1. **Create Railway account:**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **New Project → Deploy from GitHub repo:**
   - Select bean-beacon-backend
   - Railway auto-detects Node.js

3. **Configure variables:**
   - Go to Variables tab
   - Add all environment variables

4. **Deploy:**
   - Railway deploys automatically

### Option 3: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create bean-beacon-api

# Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your_secret_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Option 4: Self-Hosted (VPS)

1. **Using PM2 for process management:**
   ```bash
   npm install -g pm2
   
   # Build
   npm run build
   
   # Start with PM2
   pm2 start dist/index.js --name "bean-beacon-api"
   pm2 startup
   pm2 save
   ```

2. **Nginx reverse proxy:**
   ```nginx
   server {
     listen 80;
     server_name api.yourdomain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

3. **SSL with Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

## Database Setup

### Option 1: MongoDB Atlas (Cloud, Recommended)

1. **Create account:**
   - Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Create free cluster

2. **Create database user:**
   - Username: your_username
   - Password: your_strong_password
   - Save credentials securely

3. **Get connection string:**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<username>`, `<password>`, and `<databasename>`

4. **Set MONGODB_URI:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/bean-beacon
   ```

### Option 2: Self-Hosted MongoDB

1. **Install MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb
   
   # macOS
   brew install mongodb-community
   ```

2. **Start MongoDB:**
   ```bash
   sudo systemctl start mongodb
   ```

3. **Set connection string:**
   ```
   MONGODB_URI=mongodb://localhost:27017/bean-beacon
   ```

## Environment Configuration

### Production Environment Variables

**Frontend (.env.production):**
```
VITE_API_URL=https://api.yourdomain.com/api
```

**Backend (.env.production):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bean-beacon
JWT_SECRET=generate-long-random-secure-string-here
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
```

### Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Post-Deployment Checklist

- [ ] Frontend is accessible at your domain
- [ ] Backend API is responding (test `/api/health`)
- [ ] User can register and login
- [ ] Location permission works
- [ ] Cafés load on map
- [ ] Search and filters work
- [ ] Favorites can be added/removed
- [ ] Reviews can be posted
- [ ] Dark mode toggle works
- [ ] Console has no errors
- [ ] HTTPS is enabled on both frontend and backend
- [ ] Environment variables are set correctly
- [ ] MongoDB is backing up regularly
- [ ] API rate limiting is configured (optional)
- [ ] CORS is properly configured

## Troubleshooting

### Deploy frontend but backend API times out
- Check backend URL in VITE_API_URL
- Ensure backend is running and accessible
- Check CORS configuration in backend

### MonthgoDB connection fails
- Verify MONGODB_URI syntax
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### Can't login after deployment
- Check JWT_SECRET is set correctly
- Verify database is accessible
- Check browser console for errors

### Cafés not loading
- Verify Overpass API is accessible
- Check geolocation permission
- Ensure backend can reach Overpass API

## Monitoring & Maintenance

### Monitor logs
```bash
# Render
# View in Render dashboard Logs tab

# Railway
# View in Railway dashboard Deployments tab

# Self-hosted with PM2
pm2 logs bean-beacon-api
```

### Regular backups
- Enable automatic backups in MongoDB Atlas
- Download backups regularly if self-hosting

### Update dependencies
```bash
npm outdated
npm update
npm audit fix
```

## Cost Estimates

**Free tier (small hobby project):**
- Vercel frontend: Free
- Render backend: Free
- MongoDB Atlas: Free (500MB)
- Total: **$0/month**

**Professional setup (small to medium traffic):**
- Vercel Pro: $20/month
- Render paid tier: $7/month
- MongoDB Atlas M0: Free, or M2: $2/month
- Cloudflare: $20/month
- Domain: $10-15/year
- Total: **~$47-50/month**

---

Ready to deploy? Follow the steps above and let me know if you run into any issues!
