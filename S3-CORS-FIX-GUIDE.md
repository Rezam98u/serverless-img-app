# S3 CORS Configuration Guide

## 🎯 Problem
Your browser is blocking the direct upload to S3 because of CORS (Cross-Origin Resource Sharing) restrictions. You're getting:
```
CORS Missing Allow Origin
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
```

## 🔧 Solutions

### Method 1: Using AWS CLI (Recommended)

1. **Run the provided script:**
   ```bash
   ./fix-s3-cors.sh
   ```

2. **Or manually with AWS CLI:**
   ```bash
   aws s3api put-bucket-cors \
     --bucket snapvault-images-reza \
     --cors-configuration file://s3-cors-config.json
   ```

### Method 2: Using AWS Console

1. **Go to S3 Console:**
   - Navigate to https://console.aws.amazon.com/s3/
   - Click on your bucket: `snapvault-images-reza`

2. **Configure CORS:**
   - Click on "Permissions" tab
   - Scroll down to "Cross-origin resource sharing (CORS)"
   - Click "Edit"
   - Paste this configuration:

```json
[
  {
    "AllowedHeaders": [
      "Authorization",
      "Content-Length",
      "Content-Type",
      "Date",
      "ETag",
      "User-Agent",
      "x-amz-content-sha256",
      "x-amz-date",
      "x-amz-security-token",
      "x-amz-checksum-crc32",
      "x-amz-sdk-checksum-algorithm"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id",
      "x-amz-delete-marker",
      "x-amz-checksum-crc32"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

3. **Save changes**

### Method 3: Using AWS SDK in Node.js

If you prefer to do this programmatically:

```javascript
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'eu-north-1' });

const corsParams = {
  Bucket: 'snapvault-images-reza',
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedHeaders: [
          'Authorization',
          'Content-Length',
          'Content-Type',
          'Date',
          'ETag',
          'User-Agent',
          'x-amz-content-sha256',
          'x-amz-date',
          'x-amz-security-token',
          'x-amz-checksum-crc32',
          'x-amz-sdk-checksum-algorithm'
        ],
        ExposeHeaders: [
          'ETag',
          'x-amz-version-id',
          'x-amz-delete-marker',
          'x-amz-checksum-crc32'
        ],
        MaxAgeSeconds: 3000
      }
    ]
  }
};

try {
  await s3Client.send(new PutBucketCorsCommand(corsParams));
  console.log('CORS configuration applied successfully');
} catch (error) {
  console.error('Error applying CORS configuration:', error);
}
```

## 🔍 Verify CORS Configuration

After applying the configuration, verify it works:

```bash
aws s3api get-bucket-cors --bucket snapvault-images-reza
```

## 🚀 After Fixing CORS

Once CORS is properly configured:

1. **Test your upload again** - it should work without CORS errors
2. **Check the browser console** - you should see successful upload logs
3. **Verify in S3** - the file should appear in your bucket under `uploads/`

## 🔐 Security Note

The current configuration uses `"AllowedOrigins": ["*"]` which allows any domain. For production, consider restricting this to your specific domain:

```json
"AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"]
```

## 🛠️ Troubleshooting

### If CORS still doesn't work:

1. **Wait a few minutes** - CORS changes can take time to propagate
2. **Clear browser cache** - Old CORS policies might be cached
3. **Check bucket permissions** - Ensure your AWS credentials have permission to modify bucket CORS
4. **Verify bucket name** - Make sure `snapvault-images-reza` is correct

### If you get permission errors:

Make sure your AWS credentials have these permissions:
- `s3:PutBucketCORS`
- `s3:GetBucketCORS`

## ✅ Expected Result

After fixing CORS, your browser console should show:
```
Upload URL received: https://snapvault-images-reza.s3.eu-north-1.amazonaws.com/uploads/...
S3 upload successful
Image uploaded successfully!
```

## 🎉 Next Steps

Once CORS is fixed and uploads are working:
1. Test with different file types and sizes
2. Implement file size validation if needed
3. Consider adding progress indicators for large uploads
4. Implement proper error handling for network issues