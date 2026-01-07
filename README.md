# Centralized Release & Downtime Dashboard

A professional React application designed to manage and track application releases and maintenance downtimes across multiple services.

## 🚀 Overview
This application serves as a centralized hub for tracking:
- **Application Releases**: Keep a history of versions and release dates.
- **Downtime Management**: Log and monitor scheduled or unscheduled service maintenances.
- **Real-time Data**: Integrated with AWS S3 for direct file-based storage.

## 🛠 Features
- **Summary Dashboard**: High-level view of all applications.
- **Granular Tracking**: Dedicated sections for Releases and Downtime.
- **AWS S3 Integration**: Uses S3 as a JSON "Database" for easy setup and low cost.
- **TypeScript & Vite**: Built for performance and reliability.
- **PrimeReact & PrimeIcons**: Enterprise-grade UI components.

## 📖 Documentation
For detailed information on how to deploy this application to your own AWS environment, please refer to:
- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Step-by-step guide for AWS S3 hosting and configuration.

## 💻 Tech Stack
- **Frontend**: React 19, Vite, TypeScript
- **Styling**: PrimeFlex, SASS
- **Storage**: AWS S3 (via SDK v3)
- **Icons**: PrimeIcons, Lucide-React

## 📦 Getting Started
1. Unzip the project.
2. Run `npm install` to install dependencies.
3. Follow the instructions in `DEPLOYMENT.md` to set up your `.env` and AWS resources.
4. Run `npm run dev` for local development or `npm run build` for production.

---
*Created for the Centralized Release & Downtime Tracking System.*
