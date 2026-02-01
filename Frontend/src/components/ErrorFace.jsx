import React from 'react';
import '../styles/ErrorFace.css';

const ErrorFace = ({ message }) => {
  return (
    <div className="error-body">
      <div className="face">
        <div className="band">
          <div className="red"></div>
          <div className="white"></div>
          <div className="blue"></div>
        </div>
        <div className="eyes"></div>
        <div className="dimples"></div>
        <div className="mouth"></div>
      </div>
      <h1>Oops! Something went wrong!</h1>
      <p className="mail-notice">
        {message || "Don't worry, we have mailed our team about this error."}
      </p>
      <button className="btn" onClick={() => (window.location.href = '/')}>
        Return to Home
      </button>
    </div>
  );
};

export default ErrorFace;