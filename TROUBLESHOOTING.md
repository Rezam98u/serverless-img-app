# Lambda Function Body Issue Troubleshooting Guide

## Problem Description
Your Lambda function is receiving `event.body` as `null` or `undefined`, even though the frontend is sending the correct data.

## Root Causes & Solutions

### 1. API Gateway Integration Type Issue

**Problem**: API Gateway might not be configured to pass the request body to Lambda.

**Check**: In your API Gateway console:
- Go to your API → Resources → POST method
- Click on "Integration Request"
- Verify "Integration type" is set to "Lambda Function"
- Verify "Use Lambda Proxy integration" is **ENABLED**

**Fix**: Enable Lambda Proxy Integration in API Gateway.

### 2. Content-Type Header Issues

**Problem**: API Gateway might not recognize the content-type.

**Current Fix Applied**: The updated UploadForm now explicitly sets:
```javascript
headers: {
  'Content-Type': 'application/json'
}
```

### 3. AWS Amplify API Configuration

**Problem**: Amplify might not be configured correctly for your API.

**Check your Amplify configuration** (usually in `src/aws-exports.js` or similar):
```javascript
const awsconfig = {
  // ... other config
  API: {
    endpoints: [
      {
        name: "ImageAPI",
        endpoint: "https://your-api-id.execute-api.region.amazonaws.com/stage",
        region: "eu-north-1"
      }
    ]
  }
};
```

### 4. Lambda Function Improvements Applied

The updated Lambda function now:
- ✅ Handles multiple event formats (API Gateway, direct invoke, etc.)
- ✅ Provides detailed debugging information
- ✅ Better error handling and validation
- ✅ Supports both `event.body` and direct parameters

## Testing Steps

### Step 1: Test Lambda Function Locally
```bash
node test-lambda.js
```

This will test different event formats and show you which ones work.

### Step 2: Check API Gateway Logs
1. Go to API Gateway console
2. Select your API → Stages → your stage
3. Click on "Logs/Tracing" tab
4. Enable "Enable CloudWatch Logs"
5. Set "Log level" to "INFO"
6. Look for request/response logs

### Step 3: Check Lambda Function Logs
1. Go to CloudWatch console
2. Navigate to "Log groups"
3. Find your Lambda function's log group
4. Look for the debug output from your function

### Step 4: Test with Postman/curl
Test your API endpoint directly:

```bash
curl -X POST https://your-api-id.execute-api.eu-north-1.amazonaws.com/prod/presign-url \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.jpg",
    "userId": "test-user",
    "contentType": "image/jpeg"
  }'
```

## Common Fixes

### Fix 1: Update API Gateway Integration
1. Go to API Gateway console
2. Resources → your resource → POST
3. Integration Request
4. Enable "Use Lambda Proxy integration"
5. Deploy API

### Fix 2: Check CORS Configuration
Make sure your API Gateway has CORS enabled:
1. Select your resource
2. Actions → Enable CORS
3. Set:
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Headers: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
   - Access-Control-Allow-Methods: `GET,POST,OPTIONS`

### Fix 3: Verify Amplify Configuration
Check that your Amplify API configuration matches your actual API Gateway endpoint.

## Expected Debug Output

With the updated code, you should see logs like:
```
Received event: { ... full event object ... }
Found body in event.body: {"filename":"test.jpg","userId":"test-user","contentType":"image/jpeg"}
Parsed body: { filename: "test.jpg", userId: "test-user", contentType: "image/jpeg" }
Generated imageId: test-user-1234567890-test.jpg
Generated uploadUrl successfully
```

If you see:
```
No body found in request
Available event keys: ["httpMethod", "headers", "requestContext", ...]
```

This indicates an API Gateway integration issue.

## Next Steps

1. **Deploy the updated Lambda function** with the new error handling
2. **Update your frontend** with the improved UploadForm
3. **Test the upload** and check the browser console for detailed logs
4. **Check CloudWatch logs** for the Lambda function's debug output
5. **Verify API Gateway configuration** if the issue persists

The updated code provides much better debugging information, so you'll be able to see exactly what's happening with the request body.