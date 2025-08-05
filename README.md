# Serverless Image Hosting & Sharing App

A modern React application for uploading, storing, and searching images using AWS serverless services.

## Features

### 🖼️ Image Upload
- Drag and drop or click to select images
- Add tags to images for better organization
- Automatic upload to AWS S3 with metadata storage
- Real-time upload progress and status feedback

### 🔍 Image Search & Gallery
- Search images by tags
- Browse all uploaded images in a responsive grid
- Modern card-based layout with hover effects
- Responsive design for mobile and desktop

### 🏗️ Architecture
- **Frontend**: React with AWS Amplify v6
- **Backend**: AWS Lambda functions
- **Storage**: Amazon S3 for images, DynamoDB for metadata
- **API**: Amazon API Gateway
- **Authentication**: AWS Cognito

## AWS Services Used

### Lambda Functions
- `SaveImageMetadata`: Stores image metadata in DynamoDB
- `ProcessS3Upload`: Handles S3 upload processing
- `SearchImages`: Searches images by tags

### API Gateway Endpoints
- `POST /presign-url`: Get pre-signed URL for S3 upload
- `POST /save-metadata`: Save image metadata
- `GET /search-images`: Search images by tags

### Storage
- **S3 Bucket**: `snapvault-images-reza` for image storage
- **DynamoDB Table**: `ImageMetadata` for metadata storage

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- AWS account with configured services
- AWS Amplify CLI (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd serverless-image-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure AWS Amplify:
   - Ensure `src/aws-exports.js` contains your AWS configuration
   - Update API endpoints if needed

4. Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Usage

### Uploading Images
1. Click "Upload Images" section
2. Select an image file (JPG, PNG, etc.)
3. Add tags separated by commas (e.g., "nature, landscape, sunset")
4. Click "Upload Image"
5. Wait for upload confirmation

### Searching Images
1. Use the search bar in the "Search & Browse Images" section
2. Enter a tag to search for (e.g., "nature")
3. Click "Search" or press Enter
4. View filtered results in the gallery below

### Browsing All Images
- The gallery automatically displays all uploaded images
- Images are shown in a responsive grid layout
- Hover over images to see tags and upload dates
- Click on images to view them in full size

## Component Structure

```
src/
├── App.js                 # Main application component
├── App.css               # Main application styles
├── aws-exports.js        # AWS configuration
└── ImgUploader/
    ├── UploadForm.jsx    # Image upload component
    ├── UploadForm.css    # Upload form styles
    ├── SearchBar.jsx     # Search functionality
    ├── SearchBar.css     # Search bar styles
    ├── Gallery.jsx       # Image gallery component
    └── Gallery.css       # Gallery styles
```

## API Endpoints

### Search Images
```
GET /search-images?tag={searchTerm}
```
Returns filtered images based on the provided tag.

### Get Pre-signed URL
```
POST /presign-url
Body: { filename: string, userId: string }
```
Returns a pre-signed URL for direct S3 upload.

### Save Metadata
```
POST /save-metadata
Body: { imageUrl: string, tags: string[], userId: string, timestamp: string }
```
Saves image metadata to DynamoDB.

## Styling

The application uses modern CSS with:
- Responsive grid layouts
- Smooth hover animations
- Gradient backgrounds
- Card-based design
- Mobile-first approach

## Error Handling

The application includes comprehensive error handling:
- Network request failures
- File upload errors
- Invalid file types
- Search failures
- Loading states and retry mechanisms

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
