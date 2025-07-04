# Deployment Guide

## Deploying to Vercel

### Prerequisites

1. Install Vercel CLI: `npm i -g vercel`
2. Have a Vercel account
3. Ensure your code is in a Git repository

### Steps

1. **Build the project**

   ```bash
   cd api
   npm run build
   ```

2. **Deploy to Vercel**

   ```bash
   vercel
   ```

3. **Follow the prompts**

   - Link to existing project or create new one
   - Set project name (e.g., `chromapath-api`)
   - Confirm deployment settings

4. **Set environment variables** (if needed)
   ```bash
   vercel env add NODE_ENV production
   ```

### Configuration

The `vercel.json` file is already configured for:

- Serverless function deployment
- API route handling
- 30-second function timeout
- Proper routing for `/api/*` endpoints

### Testing Deployment

After deployment, test your endpoints:

```bash
# Health check
curl https://your-app.vercel.app/api/v1/boards/health

# Generate a board
curl https://your-app.vercel.app/api/v1/boards/random?size=5

# Get constraints
curl https://your-app.vercel.app/api/v1/boards/constraints
```

### Environment Variables

For production, you may want to set:

- `NODE_ENV=production`
- Database connection strings (when you add database integration)

### Monitoring

- Use Vercel dashboard to monitor function performance
- Check function logs for errors
- Monitor cold start times

### Future Database Integration

When you're ready to add database integration:

1. **Add database connection**

   - Set up PostgreSQL/MySQL on Vercel or external provider
   - Add connection environment variables

2. **Update BoardService**

   - Uncomment and implement the database methods
   - Add proper error handling

3. **Add cache management endpoints**

   - Implement cache replenishment API
   - Add cache statistics endpoints

4. **Deploy updates**
   ```bash
   vercel --prod
   ```

### Performance Considerations

- **Cold starts**: Serverless functions have cold start latency
- **Function timeout**: Set to 30 seconds max
- **Memory usage**: Monitor board generation memory usage
- **Database connections**: Use connection pooling for database integration
