# 🖼️ Serverless Image Hosting & Sharing App

A modern, secure, and scalable image hosting application built with React.js and AWS serverless services. Upload, organize, and share your images with powerful tagging and search capabilities.

![React](https://img.shields.io/badge/React-18.0.0-blue.svg)
![AWS](https://img.shields.io/badge/AWS-Serverless-orange.svg)
![Amplify](https://img.shields.io/badge/AWS-Amplify-yellow.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## ✨ Features

### 🔐 **Authentication & Security**
- **Secure User Authentication**: AWS Cognito integration with email verification
- **Password Requirements**: Strong password validation with real-time feedback
- **Rate Limiting**: Protection against brute force attacks (5 attempts max)
- **User Isolation**: Each user can only access their own images
- **Input Validation**: Comprehensive client and server-side validation

### 📤 **Image Upload**
- **Drag & Drop Support**: Intuitive file upload interface with visual feedback
- **File Validation**: Type, size, and name validation with detailed error messages
- **Progress Tracking**: Real-time upload progress with stage indicators
- **Tag Management**: Add multiple tags with automatic normalization
- **Large File Support**: Up to 10MB per image
- **Multiple Formats**: JPG, PNG, GIF, WebP, BMP support

### 🔍 **Search & Organization**
- **Smart Tagging**: Automatic tag normalization and deduplication
- **Real-time Search**: Debounced search with instant results
- **Search History**: Recent searches with quick access
- **Advanced Filtering**: Filter by multiple tags simultaneously
- **User-specific Results**: Only shows current user's images

### 🖼️ **Gallery & Management**
- **Responsive Grid**: Adaptive layout for all screen sizes
- **Image Preview**: Full-screen lightbox with image details
- **Copy Links**: One-click image link copying
- **Delete Images**: Secure deletion with confirmation dialogs
- **Broken Image Detection**: Automatic cleanup of broken links
- **Loading States**: Smooth loading indicators and error handling

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Beautiful Gradients**: Modern gradient backgrounds and animations
- **Smooth Animations**: CSS transitions and micro-interactions
- **Error Boundaries**: Graceful error handling with recovery options
- **Accessibility**: ARIA labels and keyboard navigation support

## 🏗️ Architecture

### **Frontend (React.js)**
- **React 18**: Latest React features with hooks
- **Performance Optimized**: Memoization, lazy loading, and code splitting
- **Error Boundaries**: Comprehensive error handling
- **Responsive Design**: Mobile-first approach
- **Modern CSS**: Flexbox, Grid, and CSS animations

### **Backend (AWS Serverless)**
- **AWS Lambda**: Serverless compute for API endpoints
- **Amazon S3**: Scalable object storage for images
- **Amazon DynamoDB**: NoSQL database for metadata
- **API Gateway**: RESTful API with CORS support
- **AWS Cognito**: User authentication and management

### **Security Features**
- **IAM Roles**: Least privilege access control
- **Pre-signed URLs**: Secure direct S3 uploads
- **Input Sanitization**: Protection against XSS and injection attacks
- **CORS Configuration**: Proper cross-origin resource sharing
- **HTTPS Only**: All communications encrypted

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+ and npm
- AWS Account with appropriate permissions
- AWS CLI configured

### **1. Clone and Install**
```bash
git clone https://github.com/yourusername/serverless-image-app.git
cd serverless-image-app
npm install
```

### **2. AWS Setup**

#### **Create S3 Bucket**
```bash
aws s3 mb s3://your-image-bucket-name
aws s3api put-bucket-cors --bucket your-image-bucket-name --cors-configuration file://cors.json
```

Create `cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ]
}
```

#### **Create DynamoDB Table**
```bash
aws dynamodb create-table \
  --table-name ImageMetadata \
  --attribute-definitions AttributeName=imageId,AttributeType=S \
  --key-schema AttributeName=imageId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

#### **Set up AWS Cognito**
1. **Create User Pool**:
   - Go to AWS Console → Cognito → User Pools
   - Create pool with email verification
   - Note the User Pool ID

2. **Create Identity Pool**:
   - Go to Federated Identities
   - Create identity pool linked to your user pool
   - Note the Identity Pool ID

3. **Configure App Client**:
   - In your User Pool, create an app client
   - Note the Client ID

#### **Deploy Lambda Functions**
Deploy these Lambda functions with appropriate IAM roles:

- **SaveImageMetadata**: Saves image metadata to DynamoDB
- **SearchImages**: Retrieves and filters images
- **ProcessS3Upload**: Generates pre-signed URLs
- **DeleteImage**: Removes images from S3 and DynamoDB

### **3. Configure Environment**

Create `src/aws-exports.js`:
```javascript
const awsConfig = {
  Auth: {
    region: 'your-region',
    userPoolId: 'your-user-pool-id',
    userPoolWebClientId: 'your-client-id',
    identityPoolId: 'your-identity-pool-id'
  },
  API: {
    endpoints: [{
      name: 'ImageAPI',
      endpoint: 'your-api-gateway-url',
      region: 'your-region'
    }]
  },
  Storage: {
    AWSS3: {
      bucket: 'your-image-bucket-name',
      region: 'your-region'
    }
  }
};

export default awsConfig;
```

### **4. Start Development**
```bash
npm start
```

## 🔧 Configuration

### **Environment Variables**
```bash
REACT_APP_AWS_REGION=your-region
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-client-id
REACT_APP_IDENTITY_POOL_ID=your-identity-pool-id
REACT_APP_API_ENDPOINT=your-api-gateway-url
REACT_APP_S3_BUCKET=your-image-bucket-name
```

### **Lambda Function Permissions**
Ensure Lambda functions have appropriate IAM permissions:
- **DynamoDB**: `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:DeleteItem`, `dynamodb:Scan`
- **S3**: `s3:PutObject`, `s3:DeleteObject`, `s3:GetObject`
- **CloudWatch**: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`

### **API Gateway Configuration**
Your API Gateway should have these endpoints:
```
POST /save-metadata → SaveImageMetadata Lambda
POST /presign-url → ProcessS3Upload Lambda
GET /search-images → SearchImages Lambda
POST /delete-image → DeleteImage Lambda
```

## 📱 Usage

### **Authentication**
1. Sign up with email and password
2. Verify email address
3. Sign in to access the application

### **Uploading Images**
1. Drag and drop images or click to browse
2. Add descriptive tags (comma-separated)
3. Click "Upload Image" to start upload
4. Monitor progress and wait for completion

### **Managing Images**
1. **Search**: Use the search bar to filter by tags
2. **View**: Click any image to open in lightbox
3. **Copy Link**: Use the copy button to share image URLs
4. **Delete**: Click the delete button and confirm removal

### **Cleanup**
- Use "Cleanup Broken Images" to remove orphaned entries
- Images are automatically validated during upload

## 🔒 Security Considerations

### **Data Protection**
- All images are stored in private S3 buckets
- User data is isolated by user ID
- No cross-user data access possible
- Automatic cleanup of broken image references

### **Input Validation**
- File type and size validation
- Tag sanitization and normalization
- XSS protection on all inputs
- SQL injection prevention (DynamoDB)

### **Access Control**
- JWT-based authentication
- Role-based access control
- Pre-signed URLs for secure uploads
- CORS properly configured

## 🚀 Deployment

### **Production Build**
```bash
npm run build
```

### **AWS Amplify Deployment**
1. Connect repository to AWS Amplify
2. Configure build settings
3. Deploy automatically on push

### **Manual S3 Deployment**
```bash
npm run build
aws s3 sync build/ s3://your-website-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🧪 Testing

### **Unit Tests**
```bash
npm test
```

### **Integration Tests**
```bash
npm run test:integration
```

### **E2E Tests**
```bash
npm run test:e2e
```

## 📊 Performance

### **Optimizations**
- **Image Optimization**: Automatic compression and resizing
- **Lazy Loading**: Images load as needed
- **Caching**: Browser and CDN caching strategies
- **Code Splitting**: Dynamic imports for better performance
- **Memoization**: React.memo and useMemo for expensive operations

### **Monitoring**
- CloudWatch metrics for Lambda functions
- S3 access logs
- DynamoDB performance insights
- Frontend performance monitoring

## 🐛 Troubleshooting

### **Common Issues**

1. **Upload Fails**:
   - Check S3 bucket permissions
   - Verify pre-signed URL generation
   - Ensure file size is under 10MB

2. **Images Not Loading**:
   - Check S3 bucket CORS configuration
   - Verify image URLs in DynamoDB
   - Use cleanup function for broken images

3. **Search Not Working**:
   - Check DynamoDB scan permissions
   - Verify tag format and normalization
   - Ensure user ID filtering is working

4. **Authentication Issues**:
   - Verify Cognito configuration
   - Check user pool settings
   - Ensure email verification is complete

5. **API Gateway 403/404 Errors**:
   - Check API Gateway resource policy
   - Verify Cognito Identity Pool permissions
   - Ensure correct HTTP methods are configured

### **Debug Mode**
Enable debug logging:
```javascript
localStorage.setItem('debug', 'true');
```

### **AWS CLI Commands**
```bash
# Check API Gateway methods
aws apigateway get-resources --rest-api-id YOUR_API_ID

# Test API endpoint
curl -X GET "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/search-images?userId=test"

# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow React best practices
- Use TypeScript for new features
- Add tests for new functionality
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AWS Amplify for the development framework
- React team for the amazing frontend library
- AWS Lambda for serverless computing
- The open-source community for inspiration and tools

## 📞 Support

If you encounter any issues or have questions:

1. **Check the troubleshooting section** above
2. **Search existing issues** in the GitHub repository
3. **Create a new issue** with detailed information
4. **Contact the maintainers** for urgent issues

## 🔄 Changelog

### **v1.0.0** (Current)
- Initial release
- Complete image upload and management system
- User authentication with AWS Cognito
- Responsive design and modern UI
- Comprehensive error handling

---

**Built with ❤️ using React.js and AWS Serverless**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/serverless-image-app.svg?style=social&label=Star)](https://github.com/yourusername/serverless-image-app)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/serverless-image-app.svg?style=social&label=Fork)](https://github.com/yourusername/serverless-image-app)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/serverless-image-app.svg)](https://github.com/yourusername/serverless-image-app/issues)
