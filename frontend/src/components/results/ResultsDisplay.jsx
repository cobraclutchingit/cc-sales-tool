import React from 'react';
import { useAppContext } from '../../context/AppContext';

const ResultsDisplay = ({ activeTab }) => {
  const {
    // Profile analysis
    profileData,
    profileContent,
    profileLoading,
    profileError,
    
    // Company analysis
    companyData,
    companyContent,
    decisionMakers,
    companyLoading,
    companyError,
    
    // Message analysis
    messageAnalysis,
    responseContent,
    messageLoading,
    messageError,
    
    // Shared state
    processingStage,
    outputFormat
  } = useAppContext();

  // Function to copy content to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Content copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Render loading state
  if (
    (activeTab === 'profile' && profileLoading) ||
    (activeTab === 'company' && companyLoading) ||
    (activeTab === 'message' && messageLoading)
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg font-medium text-gray-700 mb-2">
          {processingStage === 'loading' && 'Collecting data...'}
          {processingStage === 'analyzing' && 'Analyzing information...'}
          {processingStage === 'generating' && 'Generating content...'}
        </p>
        <div className="w-12 h-12 border-4 border-vigilantex-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render error state
  if (
    (activeTab === 'profile' && profileError) ||
    (activeTab === 'company' && companyError) ||
    (activeTab === 'message' && messageError)
  ) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-red-700">
          {activeTab === 'profile' && profileError}
          {activeTab === 'company' && companyError}
          {activeTab === 'message' && messageError}
        </p>
      </div>
    );
  }

  // Render profile results
  if (activeTab === 'profile' && profileData && profileContent) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Profile Insights</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {profileData.name}</p>
            <p><span className="font-medium">Title:</span> {profileData.title}</p>
            <p><span className="font-medium">Company:</span> {profileData.company}</p>
            <p><span className="font-medium">Location:</span> {profileData.location}</p>
            
            <div>
              <p className="font-medium">Experience:</p>
              <ul className="list-disc pl-5">
                {profileData.experience.map((exp, index) => (
                  <li key={index}>{exp.title} at {exp.company} ({exp.duration})</li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="font-medium">Interests:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profileData.interests.map((interest, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-200 rounded-md text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-800">Generated Content</h3>
            <span className="px-2 py-1 bg-gray-200 rounded-md text-sm">
              {outputFormat === 'email' && 'Email Format'}
              {outputFormat === 'linkedin' && 'LinkedIn Message'}
              {outputFormat === 'phone' && 'Phone Script'}
            </span>
          </div>
          
          <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md font-mono text-sm">
            {profileContent}
          </div>
          
          <button
            onClick={() => copyToClipboard(profileContent)}
            className="mt-3 px-4 py-2 bg-vigilantex-red text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vigilantex-red"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    );
  }

  // Render company results
  if (activeTab === 'company' && companyData && companyContent) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Company Insights</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {companyData.name}</p>
            <p><span className="font-medium">Industry:</span> {companyData.industry}</p>
            <p><span className="font-medium">Size:</span> {companyData.size}</p>
            <p><span className="font-medium">Location:</span> {companyData.location}</p>
            <p><span className="font-medium">Website:</span> {companyData.website}</p>
            
            <div>
              <p className="font-medium">Specialties:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {companyData.specialties.map((specialty, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-200 rounded-md text-sm">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Key Decision Makers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {decisionMakers.map((person, index) => (
              <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-gray-600">{person.title}</p>
                <a 
                  href={person.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  LinkedIn Profile
                </a>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-800">Generated Content</h3>
            <span className="px-2 py-1 bg-gray-200 rounded-md text-sm">
              {outputFormat === 'email' && 'Email Format'}
              {outputFormat === 'linkedin' && 'LinkedIn Message'}
              {outputFormat === 'phone' && 'Phone Script'}
            </span>
          </div>
          
          <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md font-mono text-sm">
            {companyContent}
          </div>
          
          <button
            onClick={() => copyToClipboard(companyContent)}
            className="mt-3 px-4 py-2 bg-vigilantex-red text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vigilantex-red"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    );
  }

  // Render message analysis results
  if (activeTab === 'message' && messageAnalysis && responseContent) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Message Analysis</h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Sentiment:</span> 
              <span className={`ml-2 px-2 py-1 rounded-md text-sm ${
                messageAnalysis.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                messageAnalysis.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {messageAnalysis.sentiment}
              </span>
            </p>
            
            <div>
              <p className="font-medium">Topics Identified:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {messageAnalysis.topics.map((topic, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-200 rounded-md text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="font-medium">Questions Detected:</p>
              <ul className="list-disc pl-5">
                {messageAnalysis.questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-800">Generated Response</h3>
            <span className="px-2 py-1 bg-gray-200 rounded-md text-sm">
              {outputFormat === 'email' && 'Email Format'}
              {outputFormat === 'linkedin' && 'LinkedIn Message'}
              {outputFormat === 'phone' && 'Phone Script'}
            </span>
          </div>
          
          <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md font-mono text-sm">
            {responseContent}
          </div>
          
          <button
            onClick={() => copyToClipboard(responseContent)}
            className="mt-3 px-4 py-2 bg-vigilantex-red text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vigilantex-red"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    );
  }

  // Default state (no data yet)
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <h3 className="text-xl font-medium text-gray-700 mb-2">No Data Yet</h3>
      <p className="text-gray-500 mb-4">
        {activeTab === 'profile' && 'Enter a LinkedIn profile URL and click "Generate Content" to analyze a potential client.'}
        {activeTab === 'company' && 'Enter a LinkedIn company URL and click "Generate Content" to analyze a company and identify key decision-makers.'}
        {activeTab === 'message' && 'Paste a client message and click "Generate Content" to analyze and generate a response.'}
      </p>
      <div className="w-16 h-16 text-gray-300">
        {activeTab === 'profile' && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
        {activeTab === 'company' && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )}
        {activeTab === 'message' && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
