import { create } from 'zustand';
import apiService from './services/apiService';

const useStore = create((set, get) => ({
  // Profile analysis
  profileUrl: '',
  profileData: null,
  profileLoading: false,
  profileError: null,
  profileContent: null,
  
  // Company analysis
  companyUrl: '',
  companyData: null,
  companyLoading: false,
  companyError: null,
  companyContent: null,
  decisionMakers: [],
  
  // Message analysis
  clientMessage: '',
  messageAnalysis: null,
  messageLoading: false,
  messageError: null,
  responseContent: null,
  
  // UI state
  activeTab: 'profile', // 'profile', 'company', or 'message'
  colorMode: 'light', // 'light' or 'dark'
  sidebarOpen: true,
  
  // Processing state
  processingStage: 'idle', // idle, loading, analyzing, generating, complete
  outputFormat: 'email', // email, linkedin, phone
  
  // Database entities
  prospects: [], // List of all prospects
  companies: [], // List of all companies
  savedAnalyses: [], // List of saved analyses
  
  // UI Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleColorMode: () => set((state) => ({ 
    colorMode: state.colorMode === 'light' ? 'dark' : 'light' 
  })),
  
  // Profile Actions
  setProfileUrl: (url) => set({ profileUrl: url }),
  
  analyzeProfile: async (additionalContext = '', modelOptions = {}) => {
    const { profileUrl, outputFormat } = get();
    if (!profileUrl) return;
    
    set({ 
      profileLoading: true,
      processingStage: 'loading',
      profileError: null 
    });
    
    try {
      // Process in stages to show visualization
      setTimeout(() => {
        set({ processingStage: 'analyzing' });
        
        setTimeout(() => {
          set({ processingStage: 'generating' });
          
          try {
            console.log("Starting profile analysis with URL:", profileUrl);
            apiService.analyzeProfile(profileUrl, outputFormat, additionalContext, modelOptions)
              .then(response => {
                if (response.status === 'success') {
                  console.log("Successful profile analysis:", response);
                  // Save to prospects list if it's a new prospect
                  const newProspect = {
                    id: Date.now(),
                    name: response.data.profileData.name,
                    title: response.data.profileData.title,
                    company: response.data.profileData.company,
                    url: profileUrl,
                    createdAt: new Date().toISOString(),
                    lastAnalyzed: new Date().toISOString(),
                  };
                  
                  set((state) => {
                    // Only add if not already in list
                    const exists = state.prospects.some(p => p.url === profileUrl);
                    return {
                      profileData: {
                        ...response.data.profileData,
                        metadata: response.data.metadata || null
                      },
                      profileContent: response.data.content,
                      profileLoading: false,
                      processingStage: 'complete',
                      prospects: exists ? state.prospects : [...state.prospects, newProspect]
                    };
                  });
                } else {
                  console.error("Failed profile analysis response:", response);
                  throw new Error(response.message || 'Failed to analyze profile');
                }
              })
              .catch(error => {
                console.error("Profile analysis error:", error);
                set({ 
                  profileError: error.message || 'An error occurred during profile analysis',
                  profileLoading: false,
                  processingStage: 'idle'
                });
              });
          } catch (outerError) {
            console.error("Outer try-catch error:", outerError);
            set({ 
              profileError: outerError.message || 'An unexpected error occurred',
              profileLoading: false,
              processingStage: 'idle'
            });
          }
        }, 1500);
      }, 1000);
      
    } catch (error) {
      set({ 
        profileError: error.message || 'An error occurred during profile analysis',
        profileLoading: false,
        processingStage: 'idle'
      });
    }
  },
  
  // Company Actions
  setCompanyUrl: (url) => set({ companyUrl: url }),
  
  analyzeCompany: async () => {
    const { companyUrl, outputFormat } = get();
    if (!companyUrl) return;
    
    set({ 
      companyLoading: true,
      processingStage: 'loading',
      companyError: null 
    });
    
    try {
      setTimeout(() => {
        set({ processingStage: 'analyzing' });
        
        setTimeout(() => {
          set({ processingStage: 'generating' });
          
          apiService.analyzeCompany(companyUrl, outputFormat)
            .then(response => {
              if (response.status === 'success') {
                // Save to companies list if it's a new company
                const newCompany = {
                  id: Date.now(),
                  name: response.data.companyData.name,
                  industry: response.data.companyData.industry,
                  size: response.data.companyData.size,
                  url: companyUrl,
                  createdAt: new Date().toISOString(),
                  lastAnalyzed: new Date().toISOString(),
                };
                
                set((state) => {
                  // Only add if not already in list
                  const exists = state.companies.some(c => c.url === companyUrl);
                  return {
                    companyData: response.data.companyData,
                    decisionMakers: response.data.decisionMakers,
                    companyContent: response.data.content,
                    companyLoading: false,
                    processingStage: 'complete',
                    companies: exists ? state.companies : [...state.companies, newCompany]
                  };
                });
              } else {
                throw new Error(response.message || 'Failed to analyze company');
              }
            })
            .catch(error => {
              set({ 
                companyError: error.message || 'An error occurred during company analysis',
                companyLoading: false,
                processingStage: 'idle'
              });
            });
        }, 1000);
      }, 1000);
      
    } catch (error) {
      set({ 
        companyError: error.message || 'An error occurred during company analysis',
        companyLoading: false,
        processingStage: 'idle'
      });
    }
  },
  
  // Message Actions
  setClientMessage: (message) => set({ clientMessage: message }),
  
  analyzeMessage: async () => {
    const { clientMessage, outputFormat } = get();
    if (!clientMessage) return;
    
    set({ 
      messageLoading: true,
      processingStage: 'loading',
      messageError: null 
    });
    
    try {
      setTimeout(() => {
        set({ processingStage: 'analyzing' });
        
        setTimeout(() => {
          set({ processingStage: 'generating' });
          
          apiService.analyzeMessage(clientMessage, outputFormat)
            .then(response => {
              if (response.status === 'success') {
                set({
                  messageAnalysis: response.data.messageAnalysis,
                  responseContent: response.data.responseContent,
                  messageLoading: false,
                  processingStage: 'complete'
                });
                
                // Save the analysis
                const newAnalysis = {
                  id: Date.now(),
                  type: 'message',
                  content: clientMessage,
                  analysis: response.data.messageAnalysis,
                  response: response.data.responseContent,
                  createdAt: new Date().toISOString(),
                };
                
                set((state) => ({
                  savedAnalyses: [...state.savedAnalyses, newAnalysis]
                }));
              } else {
                throw new Error(response.message || 'Failed to analyze message');
              }
            })
            .catch(error => {
              set({ 
                messageError: error.message || 'An error occurred during message analysis',
                messageLoading: false,
                processingStage: 'idle'
              });
            });
        }, 1000);
      }, 1000);
      
    } catch (error) {
      set({ 
        messageError: error.message || 'An error occurred during message analysis',
        messageLoading: false,
        processingStage: 'idle'
      });
    }
  },
  
  // Output Format
  setOutputFormat: (format) => set({ outputFormat: format }),
  
  // Save Analysis
  saveAnalysis: () => {
    const { activeTab, profileData, profileContent, companyData, companyContent, messageAnalysis, responseContent } = get();
    
    let newAnalysis = {
      id: Date.now(),
      type: activeTab,
      createdAt: new Date().toISOString(),
    };
    
    if (activeTab === 'profile' && profileData) {
      newAnalysis = {
        ...newAnalysis,
        profileData,
        profileContent,
      };
    } else if (activeTab === 'company' && companyData) {
      newAnalysis = {
        ...newAnalysis,
        companyData,
        companyContent,
      };
    } else if (activeTab === 'message' && messageAnalysis) {
      newAnalysis = {
        ...newAnalysis,
        messageAnalysis,
        responseContent,
      };
    } else {
      return; // Nothing to save
    }
    
    set((state) => ({
      savedAnalyses: [...state.savedAnalyses, newAnalysis]
    }));
  },
  
  // Delete Analysis
  deleteAnalysis: (id) => {
    set((state) => ({
      savedAnalyses: state.savedAnalyses.filter(analysis => analysis.id !== id)
    }));
  },
  
  // Clear form data
  clearFormData: () => {
    set({
      profileUrl: '',
      profileData: null,
      profileContent: null,
      profileError: null,
      
      companyUrl: '',
      companyData: null,
      companyContent: null,
      decisionMakers: [],
      companyError: null,
      
      clientMessage: '',
      messageAnalysis: null,
      responseContent: null,
      messageError: null,
      
      processingStage: 'idle'
    });
  }
}));

export default useStore;