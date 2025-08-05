# 🎯 Image Gallery & Search Setup Guide

## ✅ What's Been Updated

### 1. Enhanced Components
- **📂 `Gallery.jsx`** - Advanced image gallery with grid/list views, modals, filtering
- **🔍 `SearchBar.jsx`** - Comprehensive search with history, filters, and debounced input
- **📤 `UploadForm.jsx`** - Already working and enhanced

### 2. New Lambda Functions
- **`lambda-get-images.js`** - Fetches and searches images (supports both S3-only and DynamoDB)
- **`lambda-save-metadata.js`** - Saves image metadata to DynamoDB for efficient searching
- **`lambda-function.js`** - Already working (presigned URL generation)

## 🚀 Quick Start (S3-Only Mode)

The gallery will work immediately with S3-only mode (no DynamoDB setup required):

1. **Deploy the get-images Lambda function** to handle `/search-images` endpoint
2. **Your images will be fetched directly from S3**
3. **Search will work on filenames and user IDs**

## 🔧 Full Setup (Recommended)

For advanced features like tag search and better performance:

### Step 1: Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name image-metadata \
  --attribute-definitions \
      AttributeName=imageId,AttributeType=S \
      AttributeName=userId,AttributeType=S \
  --key-schema \
      AttributeName=imageId,KeyType=HASH \
      AttributeName=userId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region eu-north-1
```

### Step 2: Deploy Lambda Functions

1. **Deploy `lambda-get-images.js`** as a new Lambda function
2. **Deploy `lambda-save-metadata.js`** as a new Lambda function  
3. **Connect them to your API Gateway** with these endpoints:
   - `GET /search-images` → `lambda-get-images`
   - `POST /save-metadata` → `lambda-save-metadata`

### Step 3: Update API Gateway

Add the new endpoints to your existing API:
```
├── POST /presign-url (existing)
├── GET /search-images (new)
└── POST /save-metadata (existing, update if needed)
```

## 📱 Features Overview

### 🖼️ Image Gallery Features
- **Grid and List Views** - Toggle between different display modes
- **Image Modal** - Click images for full-size view with metadata
- **Responsive Design** - Works on desktop and mobile
- **Loading States** - Smooth loading indicators
- **Error Handling** - Graceful error messages with retry options
- **User Filtering** - Show only your images when logged in

### 🔍 Search Features
- **Real-time Search** - Debounced input for smooth searching
- **Multiple Search Types**:
  - Search by tags
  - Search by filename
  - Search by image ID
- **Search History** - Recent searches saved locally
- **User Filter** - Toggle to show only your images
- **Search Tips** - Built-in help for users

### 🏷️ Tag System
- **Visual Tag Display** - Tags shown as styled badges
- **Tag-based Search** - Search by any tag
- **Case-insensitive** - Search works regardless of case
- **Multi-tag Support** - Images can have multiple tags

## 🎨 Component Usage

### Basic Gallery
```jsx
import ImageGallery from './ImgUploader/Gallery';

// Show all images
<ImageGallery />

// Show with search term
<ImageGallery searchTerm="nature" />

// Show only user's images  
<ImageGallery showUserImagesOnly={true} />
```

### Search with Gallery
```jsx
import SearchBar from './ImgUploader/SearchBar';

// Complete search interface with gallery
<SearchBar />
```

### Custom Implementation
```jsx
import ImageGallery from './ImgUploader/Gallery';

const MyComponent = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  
  return (
    <ImageGallery 
      searchTerm="vacation"
      onImageSelect={setSelectedImage}
    />
  );
};
```

## 🔧 Configuration Options

### Environment Variables (Lambda)
```javascript
// In your Lambda functions
const BUCKET_NAME = 'snapvault-images-reza';
const TABLE_NAME = 'image-metadata';
const REGION = 'eu-north-1';
```

### Frontend Configuration
The components automatically detect:
- **Authentication status** - Shows appropriate UI
- **Current user** - For filtering user images
- **API endpoints** - Uses your existing Amplify API config

## 📊 API Endpoints

### GET /search-images
Query parameters:
- `tag` - Search by tag
- `userId` - Filter by user  
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

Response:
```json
{
  "images": [
    {
      "imageId": "user-123-filename.jpg",
      "url": "https://bucket.s3.region.amazonaws.com/uploads/...",
      "userId": "user-123",
      "tags": ["nature", "landscape"],
      "timestamp": "2025-01-05T10:30:00Z",
      "originalFilename": "vacation.jpg"
    }
  ],
  "total": 25,
  "hasMore": false
}
```

### POST /save-metadata
Request body:
```json
{
  "imageUrl": "https://bucket.s3.region.amazonaws.com/uploads/image.jpg",
  "imageId": "user-123-image.jpg", 
  "userId": "user-123",
  "tags": ["tag1", "tag2"],
  "timestamp": "2025-01-05T10:30:00Z",
  "originalFilename": "my-photo.jpg"
}
```

## 🛠️ Troubleshooting

### Images Not Loading
1. **Check S3 bucket CORS** - Already configured ✅
2. **Verify Lambda function** - Check CloudWatch logs
3. **Check API Gateway** - Ensure endpoints are deployed

### Search Not Working
1. **DynamoDB Table** - Create if using advanced search
2. **Lambda Permissions** - Ensure DynamoDB access
3. **API Endpoints** - Verify `/search-images` is connected

### Tags Not Searchable
1. **Metadata Not Saved** - Check save-metadata Lambda
2. **DynamoDB Required** - Tag search needs DynamoDB
3. **Upload Flow** - Ensure metadata is saved after upload

## 🎯 Current Status

✅ **Working Now:**
- Image upload with presigned URLs
- S3 CORS configured
- Enhanced upload form

🔄 **Next Steps:**
1. Deploy `lambda-get-images.js` function
2. Connect to `/search-images` endpoint  
3. Test basic gallery functionality
4. (Optional) Set up DynamoDB for advanced features

## 🎉 Expected Result

Once deployed, you'll have:
- **Beautiful image gallery** with grid/list views
- **Powerful search** with real-time results
- **User filtering** for personalized views
- **Tag-based organization** for easy discovery
- **Mobile-responsive** design that works everywhere

Your image gallery will be production-ready with all modern features! 🚀