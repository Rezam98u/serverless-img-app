const awsconfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-north-1_jhEA0gB7K',
      userPoolClientId: '1il3ldcoluo5e67hvqh5acnts9',
      identityPoolId: 'eu-north-1:ca28228d-8b3b-44d0-8e5a-16501a72de7c',
      // Add this to ensure proper token handling
      allowGuestAccess: false,
    },
  },
  API: {
    REST: {
      ImageAPI: {
        endpoint: 'https://xsdq7c9i5m.execute-api.eu-north-1.amazonaws.com/prod',
        region: 'eu-north-1',
      },
    },
  },
};

export default awsconfig;