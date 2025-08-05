import { useState, useCallback } from 'react';
import { get, post } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';

export const useImages = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchImages = useCallback(async (searchTerm = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const options = searchTerm && searchTerm.trim() !== '' 
        ? { queryStringParameters: { tag: searchTerm.trim() } }
        : {};
        
      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options
      }).response;

      const data = await response.body.json();
      
      let images = [];
      if (data.body) {
        try {
          const parsedBody = JSON.parse(data.body);
          images = parsedBody.images || [];
        } catch (parseError) {
          console.error('Parse error:', parseError);
          setError('Error parsing response');
          return;
        }
      }
      
      setImages(images);
      
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to fetch images. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteImage = useCallback(async (imageId) => {
    try {
      const user = await getCurrentUser();
      const userId = user.username;

      const deleteRequest = {
        apiName: 'ImageAPI',
        path: '/delete-image',
        options: {
          body: { imageId, userId }
        }
      };
      
      const response = await post(deleteRequest).response;
      const result = await response.body.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setImages(prevImages => 
        prevImages.filter(img => img.imageId !== imageId)
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const refreshImages = useCallback(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    loading,
    error,
    fetchImages,
    deleteImage,
    refreshImages
  };
};