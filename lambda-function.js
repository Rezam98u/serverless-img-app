import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'eu-north-1' });
const BUCKET_NAME = 'snapvault-images-reza';

export const handler = async (event) => {
  // Add CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS,GET',
  };

  try {
    // Log the entire event for debugging
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight' }),
      };
    }

    // Try to extract the request body from different possible locations
    let requestBody = null;
    
    // Check direct body (API Gateway Lambda proxy integration)
    if (event.body) {
      requestBody = event.body;
      console.log('Found body in event.body:', requestBody);
    }
    // Check if body is in a different location (some API Gateway configurations)
    else if (event.rawBody) {
      requestBody = event.rawBody;
      console.log('Found body in event.rawBody:', requestBody);
    }
    // Check if the entire event is the body (Lambda function URL or direct invoke)
    else if (event.filename && event.userId) {
      requestBody = JSON.stringify(event);
      console.log('Found body parameters directly in event:', requestBody);
    }
    // Check if body is base64 encoded
    else if (event.isBase64Encoded && event.body) {
      requestBody = Buffer.from(event.body, 'base64').toString('utf-8');
      console.log('Found base64 encoded body:', requestBody);
    }

    if (!requestBody) {
      console.error('No body found in request');
      console.log('Available event keys:', Object.keys(event));
      console.log('Event structure:', {
        hasBody: !!event.body,
        hasRawBody: !!event.rawBody,
        hasFilename: !!event.filename,
        hasUserId: !!event.userId,
        isBase64Encoded: event.isBase64Encoded,
        httpMethod: event.httpMethod,
        requestContext: event.requestContext
      });
      
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Request body is required',
          debug: {
            eventKeys: Object.keys(event),
            hasBody: !!event.body,
            hasRawBody: !!event.rawBody,
            httpMethod: event.httpMethod || event.requestContext?.http?.method,
            contentType: event.headers?.['content-type'] || event.headers?.['Content-Type']
          }
        }),
      };
    }

    console.log('Raw body:', requestBody);
    
    // Parse the body
    let parsedBody;
    try {
      // If it's already an object, use it directly
      if (typeof requestBody === 'object') {
        parsedBody = requestBody;
      } else {
        parsedBody = JSON.parse(requestBody);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Body that failed to parse:', requestBody);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message,
          receivedBody: requestBody 
        }),
      };
    }

    console.log('Parsed body:', parsedBody);

    const { filename, userId, contentType } = parsedBody;

    // Validate required fields
    if (!filename || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['filename', 'userId'],
          received: parsedBody 
        }),
      };
    }

    // Validate filename
    if (typeof filename !== 'string' || filename.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid filename',
          details: 'Filename must be a non-empty string'
        }),
      };
    }

    // Sanitize filename to remove any path traversal attempts
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Generate unique image ID
    const timestamp = Date.now();
    const imageId = `${userId}-${timestamp}-${sanitizedFilename}`;
    console.log('Generated imageId:', imageId);

    // Validate content type
    const validContentType = contentType || 'application/octet-stream';
    if (contentType && !contentType.startsWith('image/')) {
      console.warn('Non-image content type provided:', contentType);
    }

    try {
      // Create S3 command
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `uploads/${imageId}`,
        ContentType: validContentType,
        Metadata: {
          'original-filename': sanitizedFilename,
          'user-id': userId,
          'upload-timestamp': timestamp.toString()
        }
      });

      // Generate pre-signed URL
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      console.log('Generated uploadUrl successfully');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          uploadUrl, 
          imageId,
          message: 'Pre-signed URL generated successfully',
          debug: {
            filename: sanitizedFilename,
            contentType: validContentType,
            userId,
            timestamp
          }
        }),
      };
    } catch (s3Error) {
      console.error('S3 error:', s3Error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to generate pre-signed URL',
          details: s3Error.message
        }),
      };
    }

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};