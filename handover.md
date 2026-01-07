# Handover Documentation: Application Release & Downtime Tracker

## Project Overview
This is a React-based static web application designed to track application releases and maintenance downtimes. It uses AWS S3 as a direct data store by reading and writing JSON files.

## Project Structure
- `src/components`: Reusable UI components (DataTable, Modal, Sidebar, etc.)
- `src/context`: Data management using React Context API.
- `src/services`: S3 service using AWS SDK for JavaScript v3.
- `src/pages`: Application views (Dashboard, Admin Management).
- `src/styles`: CSS variables and global enterprise styles.
- `src/types`: TypeScript definitions for data models.

## JSON Schema Overview

### `applications.json`
```json
[
  {
    "id": "uuid",
    "name": "App Name",
    "description": "App Description"
  }
]
```

### `downtimes.json`
```json
[
  {
    "id": "uuid",
    "applicationId": "uuid",
    "applicationName": "Cached Name",
    "startTime": "ISO String",
    "endTime": "ISO String"
  }
]
```

### `releases.json`
```json
[
  {
    "id": "uuid",
    "applicationId": "uuid",
    "applicationName": "Cached Name",
    "version": "v1.0.0",
    "releaseDate": "YYYY-MM-DD",
    "details": "Text details"
  }
]
```

## Deployment Steps

### 1. Configure AWS S3
- Create an S3 bucket.
- Enable **Static Website Hosting**.
- Configure the bucket policy for public read access (if needed) or restricted access via IAM.
- Enable **CORS** on the bucket to allow requests from your domain:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### 2. Environment Variables
Create a `.env` file based on `.env.example`:
```env
VITE_AWS_ACCESS_KEY_ID=your_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret
VITE_AWS_REGION=your_region
VITE_AWS_BUCKET_NAME=your_bucket
```

### 3. Build & Upload
- Run `npm run build`.
- Upload the contents of the `dist/` folder to your S3 bucket.

## Scaling & Performance
- Sorting, filtering, and pagination are handled entirely on the client side.
- For very large datasets, historical data should be archived to avoid performance degradation during JSON loads.
