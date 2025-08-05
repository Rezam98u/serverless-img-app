import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, ScanCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const s3Client = new S3Client({ region: 'eu-north-1' });
const dynamoClient = new DynamoDBClient({ region: 'eu-north-1' });

const BUCKET_NAME = 'snapvault-images-reza';
const TABLE_NAME = 'image-metadata'; // You'll need to create this DynamoDB table

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
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

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const { tag, userId, limit = '50', offset = '0' } = queryParams;

    console.log('Query parameters:', queryParams);

    let images = [];

    // If we have metadata in DynamoDB, use it for efficient searching
    if (await tableExists()) {
      images = await fetchImagesFromDynamoDB({ tag, userId, limit: parseInt(limit), offset: parseInt(offset) });
    } else {
      // Fallback: fetch directly from S3 (less efficient but works without DynamoDB)
      console.log('DynamoDB table not found, fetching from S3 directly');
      images = await fetchImagesFromS3({ tag, userId, limit: parseInt(limit) });
    }

    // Generate presigned URLs for viewing images
    const imagesWithUrls = await Promise.all(
      images.map(async (image) => {
        try {
          const url = `https://${BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${image.key}`;
          return {
            ...image,
            url,
            thumbnailUrl: url, // For now, using same URL. Later you could add thumbnail generation
          };
        } catch (error) {
          console.error('Error generating URL for image:', image.key, error);
          return null;
        }
      })
    );

    const validImages = imagesWithUrls.filter(img => img !== null);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        images: validImages,
        total: validImages.length,
        hasMore: validImages.length === parseInt(limit),
        message: 'Images fetched successfully'
      }),
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch images',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};

async function tableExists() {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 1
    });
    await dynamoClient.send(command);
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function fetchImagesFromDynamoDB({ tag, userId, limit, offset }) {
  try {
    let command;
    
    if (tag && userId) {
      // Search by both tag and userId
      command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'contains(tags, :tag) AND userId = :userId',
        ExpressionAttributeValues: marshall({
          ':tag': tag,
          ':userId': userId
        }),
        Limit: limit
      });
    } else if (tag) {
      // Search by tag only
      command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'contains(tags, :tag)',
        ExpressionAttributeValues: marshall({
          ':tag': tag
        }),
        Limit: limit
      });
    } else if (userId) {
      // Get images for specific user
      command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId
        }),
        Limit: limit
      });
    } else {
      // Get all images
      command = new ScanCommand({
        TableName: TABLE_NAME,
        Limit: limit
      });
    }

    const response = await dynamoClient.send(command);
    return response.Items?.map(item => {
      const unmarshalled = unmarshall(item);
      return {
        imageId: unmarshalled.imageId,
        key: unmarshalled.imageUrl ? unmarshalled.imageUrl.split('/').pop() : `uploads/${unmarshalled.imageId}`,
        userId: unmarshalled.userId,
        tags: Array.isArray(unmarshalled.tags) ? unmarshalled.tags : [],
        timestamp: unmarshalled.timestamp,
        originalFilename: unmarshalled.originalFilename || 'Unknown'
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching from DynamoDB:', error);
    return [];
  }
}

async function fetchImagesFromS3({ tag, userId, limit }) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'uploads/',
      MaxKeys: limit * 2 // Get more than needed since we'll filter
    });

    const response = await s3Client.send(command);
    const objects = response.Contents || [];

    // Filter and format images
    let filteredImages = objects
      .filter(obj => {
        // Filter out directories and non-image files
        if (obj.Key.endsWith('/')) return false;
        
        // Basic image file extension check
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        const hasImageExtension = imageExtensions.some(ext => 
          obj.Key.toLowerCase().endsWith(ext)
        );
        if (!hasImageExtension) return false;

        // Filter by userId if provided
        if (userId && !obj.Key.includes(userId)) return false;

        return true;
      })
      .slice(0, limit)
      .map(obj => {
        // Extract metadata from filename (if following our naming convention)
        const keyParts = obj.Key.split('/');
        const filename = keyParts[keyParts.length - 1];
        const nameParts = filename.split('-');
        
        return {
          imageId: filename,
          key: obj.Key,
          userId: nameParts[0] || 'unknown',
          tags: [], // No tags available when fetching directly from S3
          timestamp: obj.LastModified?.toISOString() || new Date().toISOString(),
          originalFilename: filename,
          size: obj.Size || 0
        };
      });

    // If searching by tag and we're using S3 only, we can't filter by tags
    // so we return all images with a warning
    if (tag && filteredImages.length > 0) {
      console.warn('Tag search not available when using S3 only. Consider setting up DynamoDB metadata table.');
    }

    return filteredImages;
  } catch (error) {
    console.error('Error fetching from S3:', error);
    return [];
  }
}