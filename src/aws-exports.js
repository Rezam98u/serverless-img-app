const awsConfig = {
  Auth: {
    region: 'eu-north-1',
    userPoolId: 'your-user-pool-id', // Replace with your actual User Pool ID
    userPoolWebClientId: 'your-client-id', // Replace with your actual Client ID
    identityPoolId: 'eu-north-1:your-identity-pool-id' // Replace with your actual Identity Pool ID
  },
  API: {
    endpoints: [{
      name: 'ImageAPI',
      endpoint: 'https://xsdq7c9i5m.execute-api.eu-north-1.amazonaws.com/prod',
      region: 'eu-north-1'
    }]
  },
  Storage: {
    AWSS3: {
      bucket: 'snapvault-images-reza',
      region: 'eu-north-1'
    }
  }
};

export default awsConfig;