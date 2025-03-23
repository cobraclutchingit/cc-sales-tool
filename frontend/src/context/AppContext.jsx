import React, { createContext, useContext, useState } from 'react';
import apiService from '../services/apiService';

// Create context
const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);

// Provider component
export const AppProvider = ({ children }) => {
  // State for profile analysis
  const [profileUrl, setProfileUrl] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileContent, setProfileContent] = useState(null);

  // State for company analysis
  const [companyUrl, setCompanyUrl] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState(null);
  const [companyContent, setCompanyContent] = useState(null);
  const [decisionMakers, setDecisionMakers] = useState([]);

  // State for message analysis
  const [clientMessage, setClientMessage] = useState('');
  const [messageAnalysis, setMessageAnalysis] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [responseContent, setResponseContent] = useState(null);

  // State for visualization
  const [processingStage, setProcessingStage] = useState('idle'); // idle, loading, analyzing, generating, complete
  const [outputFormat, setOutputFormat] = useState('email'); // email, linkedin, phone

  // Function to analyze LinkedIn profile
  const analyzeProfile = async () => {
    if (!profileUrl) return;
    
    try {
      setProfileLoading(true);
      setProcessingStage('loading');
      setProfileError(null);
      
      // Call the API service
      setTimeout(() => {
        setProcessingStage('analyzing');
        
        setTimeout(() => {
          setProcessingStage('generating');
          
          apiService.analyzeProfile(profileUrl, outputFormat)
            .then(response => {
              if (response.status === 'success') {
                setProfileData(response.data.profileData);
                setProfileContent(response.data.content);
                setProfileLoading(false);
                setProcessingStage('complete');
              } else {
                throw new Error(response.message || 'Failed to analyze profile');
              }
            })
            .catch(error => {
              setProfileError(error.message || 'An error occurred during profile analysis');
              setProfileLoading(false);
              setProcessingStage('idle');
            });
        }, 1000);
      }, 1000);
      
    } catch (error) {
      setProfileError(error.message || 'An error occurred during profile analysis');
      setProfileLoading(false);
      setProcessingStage('idle');
    }
  };

  // Function to analyze company
  const analyzeCompany = async () => {
    if (!companyUrl) return;
    
    try {
      setCompanyLoading(true);
      setProcessingStage('loading');
      setCompanyError(null);
      
      // Call the API service
      setTimeout(() => {
        setProcessingStage('analyzing');
        
        setTimeout(() => {
          setProcessingStage('generating');
          
          apiService.analyzeCompany(companyUrl, outputFormat)
            .then(response => {
              if (response.status === 'success') {
                setCompanyData(response.data.companyData);
                setDecisionMakers(response.data.decisionMakers);
                setCompanyContent(response.data.content);
                setCompanyLoading(false);
                setProcessingStage('complete');
              } else {
                throw new Error(response.message || 'Failed to analyze company');
              }
            })
            .catch(error => {
              setCompanyError(error.message || 'An error occurred during company analysis');
              setCompanyLoading(false);
              setProcessingStage('idle');
            });
        }, 1000);
      }, 1000);
      
    } catch (error) {
      setCompanyError(error.message || 'An error occurred during company analysis');
      setCompanyLoading(false);
      setProcessingStage('idle');
    }
  };

  // Function to analyze client message
  const analyzeMessage = async () => {
    if (!clientMessage) return;
    
    try {
      setMessageLoading(true);
      setProcessingStage('loading');
      setMessageError(null);
      
      // Call the API service
      setTimeout(() => {
        setProcessingStage('analyzing');
        
        setTimeout(() => {
          setProcessingStage('generating');
          
          apiService.analyzeMessage(clientMessage, outputFormat)
            .then(response => {
              if (response.status === 'success') {
                setMessageAnalysis(response.data.messageAnalysis);
                setResponseContent(response.data.responseContent);
                setMessageLoading(false);
                setProcessingStage('complete');
              } else {
                throw new Error(response.message || 'Failed to analyze message');
              }
            })
            .catch(error => {
              setMessageError(error.message || 'An error occurred during message analysis');
              setMessageLoading(false);
              setProcessingStage('idle');
            });
        }, 1000);
      }, 1000);
      
    } catch (error) {
      setMessageError(error.message || 'An error occurred during message analysis');
      setMessageLoading(false);
      setProcessingStage('idle');
    }
  };

  // Context value
  const value = {
    // Profile analysis
    profileUrl,
    setProfileUrl,
    profileData,
    profileLoading,
    profileError,
    profileContent,
    analyzeProfile,
    
    // Company analysis
    companyUrl,
    setCompanyUrl,
    companyData,
    companyLoading,
    companyError,
    companyContent,
    decisionMakers,
    analyzeCompany,
    
    // Message analysis
    clientMessage,
    setClientMessage,
    messageAnalysis,
    messageLoading,
    messageError,
    responseContent,
    analyzeMessage,
    
    // Shared state
    processingStage,
    outputFormat,
    setOutputFormat
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
