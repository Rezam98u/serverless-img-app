#!/bin/bash

# Script to configure S3 CORS for your bucket
# Make sure you have AWS CLI configured with proper credentials

BUCKET_NAME="my-react-lambda-demo-2025"
CORS_CONFIG_FILE="s3-cors-config.json"

echo "🔧 Configuring CORS for S3 bucket: $BUCKET_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "   Visit: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

# Check if the CORS config file exists
if [ ! -f "$CORS_CONFIG_FILE" ]; then
    echo "❌ CORS config file not found: $CORS_CONFIG_FILE"
    exit 1
fi

# Apply CORS configuration
echo "📁 Applying CORS configuration..."
aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file://"$CORS_CONFIG_FILE"

if [ $? -eq 0 ]; then
    echo "✅ CORS configuration applied successfully!"
    echo ""
    echo "🔍 Verifying CORS configuration..."
    aws s3api get-bucket-cors --bucket "$BUCKET_NAME"
else
    echo "❌ Failed to apply CORS configuration"
    echo "   Make sure:"
    echo "   1. AWS CLI is configured with proper credentials"
    echo "   2. You have permissions to modify the bucket"
    echo "   3. The bucket name is correct: $BUCKET_NAME"
    exit 1
fi

echo ""
echo "🎉 S3 CORS configuration completed!"
echo "   You can now upload files from your web application."