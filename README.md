# 🖼️ Serverless Image Hosting & Sharing App

A modern, secure, and scalable image hosting application built with React.js and AWS serverless services. Upload, organize, and share your images with powerful tagging and search capabilities.

## ✨ Features

### 🔐 **Authentication & Security**
- **Secure User Authentication**: AWS Cognito integration with email verification
- **Password Requirements**: Strong password validation with real-time feedback
- **Rate Limiting**: Protection against brute force attacks
- **User Isolation**: Each user can only access their own images
- **Input Validation**: Comprehensive client and server-side validation

### 📤 **Image Upload**
- **Drag & Drop Support**: Intuitive file upload interface
- **File Validation**: Type, size, and name validation
- **Progress Tracking**: Real-time upload progress with status updates
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
- **Dark/Light Themes**: Beautiful gradient backgrounds
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
git clone <repository-url>
cd serverless-img-app
npm install
```

### **2. AWS Setup**
1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://your-image-bucket-name
   aws s3api put-bucket-cors --bucket your-image-bucket-name --cors-configuration file://cors.json
   ```

2. **Create DynamoDB Table**:
   ```bash
   aws dynamodb create-table \
     --table-name ImageMetadata \
     --attribute-definitions AttributeName=imageId,AttributeType=S \
     --key-schema AttributeName=imageId,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```

3. **Set up AWS Cognito**:
   - Create User Pool with email verification
   - Create Identity Pool for S3 access
   - Configure app client

4. **Deploy Lambda Functions**:
   - `SaveImageMetadata`: Saves image metadata to DynamoDB
   - `SearchImages`: Retrieves and filters images
   - `ProcessS3Upload`: Generates pre-signed URLs
   - `DeleteImage`: Removes images from S3 and DynamoDB

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
      endpoint: 'your-api-gateway-url'
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

### **Debug Mode**
Enable debug logging:
```javascript
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AWS Amplify for the development framework
- React team for the amazing frontend library
- AWS Lambda for serverless computing
- The open-source community for inspiration and tools

---

**Built with ❤️ using React.js and AWS Serverless**
