import React from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import UploadForm from "./ImgUploader/UploadForm";
import SearchBar from './ImgUploader/SearchBar';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Serverless Image Hosting & Sharing App</h1>
      <UploadForm />
      <SearchBar />
    </div>
  );
}

export default withAuthenticator(App);