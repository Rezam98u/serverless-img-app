import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'eu-north-1' });
const TABLE_NAME = 'image-metadata';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };

  try {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight' }),
      };
    }

    // Extract request body
    let requestBody = null;
    
    if (event.body) {
      requestBody = event.body;
    } else if (event.imageUrl && event.userId) {
      requestBody = JSON.stringify(event);
    }

    if (!requestBody) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Request body is required',
          required: ['imageUrl', 'userId', 'tags', 'timestamp']
        }),
      };
    }

    // Parse the body
    let parsedBody;
    try {
      parsedBody = typeof requestBody === 'object' ? requestBody : JSON.parse(requestBody);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
      };
    }

    console.log('Parsed body:', parsedBody);

    const { imageUrl, imageId, userId, tags, timestamp, originalFilename } = parsedBody;

    // Validate required fields
    if (!imageUrl || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['imageUrl', 'userId'],
          received: Object.keys(parsedBody)
        }),
      };
    }

    // Extract imageId from imageUrl if not provided
    const finalImageId = imageId || imageUrl.split('/').pop().split('?')[0];
    
    // Process tags - ensure it's an array
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => tag && tag.trim()).map(tag => tag.trim().toLowerCase());
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').filter(tag => tag && tag.trim()).map(tag => tag.trim().toLowerCase());
      }
    }

    // Create metadata item
    const metadataItem = {
      imageId: finalImageId,
      userId: userId,
      imageUrl: imageUrl,
      tags: processedTags,
      timestamp: timestamp || new Date().toISOString(),
      originalFilename: originalFilename || finalImageId,
      uploadDate: new Date().toISOString(),
      // Add search-friendly fields
      searchTags: processedTags.join(' '), // For easier text searching
      yearMonth: new Date().toISOString().substring(0, 7), // For date-based queries
    };

    console.log('Saving metadata item:', metadataItem);

    // Save to DynamoDB
    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(metadataItem),
      // Prevent overwriting existing metadata
      ConditionExpression: 'attribute_not_exists(imageId) OR attribute_not_exists(userId)'
    });

    try {
      await dynamoClient.send(command);
      console.log('Metadata saved successfully');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Image metadata saved successfully',
          imageId: finalImageId,
          tagsProcessed: processedTags.length,
          metadata: {
            imageId: finalImageId,
            userId: userId,
            tags: processedTags,
            timestamp: metadataItem.timestamp
          }
        }),
      };
    } catch (dynamoError) {
      console.error('DynamoDB error:', dynamoError);
      
      // If the error is about conditional check failure, it means the item already exists
      if (dynamoError.name === 'ConditionalCheckFailedException') {
        console.log('Metadata already exists for this image');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Image metadata already exists',
            imageId: finalImageId,
            warning: 'Metadata was not updated as it already exists'
          }),
        };
      }

      // If table doesn't exist, provide helpful error
      if (dynamoError.name === 'ResourceNotFoundException') {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'DynamoDB table not found',
            details: `Table '${TABLE_NAME}' does not exist. Please create it first.`,
            tableSchema: {
              tableName: TABLE_NAME,
              primaryKey: 'imageId (String)',
              sortKey: 'userId (String)',
              attributes: [
                'imageUrl (String)',
                'tags (List)',
                'timestamp (String)',
                'originalFilename (String)',
                'searchTags (String)',
                'yearMonth (String)'
              ]
            }
          }),
        };
      }

      throw dynamoError;
    }

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to save image metadata',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};