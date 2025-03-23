import React from 'react';
import { useAppContext } from '../../context/AppContext';

const InputForm = ({ activeTab }) => {
  const {
    // Profile analysis
    profileUrl,
    setProfileUrl,
    profileLoading,
    analyzeProfile,
    
    // Company analysis
    companyUrl,
    setCompanyUrl,
    companyLoading,
    analyzeCompany,
    
    // Message analysis
    clientMessage,
    setClientMessage,
    messageLoading,
    analyzeMessage,
    
    // Shared state
    outputFormat,
    setOutputFormat
  } = useAppContext();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (activeTab === 'profile') {
      analyzeProfile();
    } else if (activeTab === 'company') {
      analyzeCompany();
    } else if (activeTab === 'message') {
      analyzeMessage();
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">
        {activeTab === 'profile' && 'LinkedIn Profile Analysis'}
        {activeTab === 'company' && 'Company Analysis'}
        {activeTab === 'message' && 'Client Message Analysis'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile URL Input */}
        {activeTab === 'profile' && (
          <div>
            <label htmlFor="profileUrl" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              id="profileUrl"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/username"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vigilantex-red"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the LinkedIn URL of the person you want to analyze
            </p>
          </div>
        )}
        
        {/* Company URL Input */}
        {activeTab === 'company' && (
          <div>
            <label htmlFor="companyUrl" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Company URL
            </label>
            <input
              type="url"
              id="companyUrl"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="https://www.linkedin.com/company/name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vigilantex-red"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the LinkedIn URL of the company you want to analyze
            </p>
          </div>
        )}
        
        {/* Client Message Input */}
        {activeTab === 'message' && (
          <div>
            <label htmlFor="clientMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Client Message
            </label>
            <textarea
              id="clientMessage"
              value={clientMessage}
              onChange={(e) => setClientMessage(e.target.value)}
              placeholder="Paste the client's message here..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vigilantex-red"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Paste the client's email or message for analysis and response generation
            </p>
          </div>
        )}
        
        {/* Output Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Output Format
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="email"
                checked={outputFormat === 'email'}
                onChange={() => setOutputFormat('email')}
                className="form-radio text-vigilantex-red"
              />
              <span className="ml-2">Email</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="linkedin"
                checked={outputFormat === 'linkedin'}
                onChange={() => setOutputFormat('linkedin')}
                className="form-radio text-vigilantex-red"
              />
              <span className="ml-2">LinkedIn Message</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="phone"
                checked={outputFormat === 'phone'}
                onChange={() => setOutputFormat('phone')}
                className="form-radio text-vigilantex-red"
              />
              <span className="ml-2">Phone Script</span>
            </label>
          </div>
        </div>
        
        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={
              (activeTab === 'profile' && (!profileUrl || profileLoading)) ||
              (activeTab === 'company' && (!companyUrl || companyLoading)) ||
              (activeTab === 'message' && (!clientMessage || messageLoading))
            }
            className="w-full px-4 py-2 bg-vigilantex-red text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vigilantex-red disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {(activeTab === 'profile' && profileLoading) ||
             (activeTab === 'company' && companyLoading) ||
             (activeTab === 'message' && messageLoading)
              ? 'Processing...'
              : 'Generate Content'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputForm;
