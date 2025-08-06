# 🖼️ Serverless Image Hosting App

A modern, secure image hosting application built with React.js and AWS serverless services that allows users to upload, organize, tag, search, and share images with enterprise-level security.

🔗 **Live Demo:** [https://serverlessimagehosting.netlify.app](https://serverlessimagehosting.netlify.app)

## 🚀 Features

### 🔐 Authentication
- User registration with email verification
- Secure login with strong password validation
- Rate limiting (5 attempts max)
- User data isolation

### 📤 Image Upload
- Drag & drop interface
- File validation (type, size, name)
- Progress tracking with visual feedback
- Tag management with automatic normalization
- Support for JPG, PNG, GIF, WebP, BMP (up to 10MB)

### 🔍 Search & Organization
- Real-time search with debouncing
- Tag-based filtering
- Search history
- User-specific results only

### 🖼️ Gallery Management
- Responsive image grid
- Full-screen lightbox preview
- Copy image links
- Delete images with confirmation
- Broken image detection and cleanup

## 🛠️ Technology Stack

### Frontend
- React 18 with Hooks
- AWS Amplify for AWS integration
- Modern CSS with responsive design
- Error Boundaries for graceful error handling

### Backend (AWS Serverless)
- AWS Lambda (4 functions for different operations)
- Amazon S3 (image storage)
- Amazon DynamoDB (metadata storage)
- API Gateway (REST API endpoints)
- AWS Cognito (user authentication)

## 📊 Key Metrics

| Aspect               | Details                          |
|----------------------|----------------------------------|
| File Size Limit      | 10MB per image                   |
| Supported Formats    | JPG, PNG, GIF, WebP, BMP         |
| Tag Limits           | 10 tags per image, 20 chars each |
| Search Delay         | 300ms debouncing                 |
| User Isolation       | Complete data separation         |
| Security             | JWT tokens, HTTPS, input validation |

## 🔧 API Endpoints

- `POST /save-metadata` → Save image metadata to DynamoDB
- `POST /presign-url` → Generate S3 upload URLs
- `GET /search-images` → Retrieve user's images
- `POST /delete-image` → Remove images from S3 and DynamoDB

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- AWS account with necessary permissions
- AWS CLI configured

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/serverless-image-hosting.git
