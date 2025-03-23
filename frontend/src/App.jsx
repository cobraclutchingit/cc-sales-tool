import React, { Suspense } from 'react';
import { ChakraProvider, Spinner, Box } from '@chakra-ui/react';
import MainLayout from './components/layout/MainLayout';
import ProfileAnalysisTab from './pages/ProfileAnalysisTab';
import CompanyAnalysisTab from './pages/CompanyAnalysisTab';
import MessageAnalysisTab from './pages/MessageAnalysisTab';
import SavedAnalysesTab from './pages/SavedAnalysesTab';
import DashboardTab from './pages/DashboardTab';
import SettingsTab from './pages/SettingsTab';
import HelpSupportTab from './pages/HelpSupportTab';
import theme from './theme';
import useStore from './store';

function App() {
  const { activeTab } = useStore();
  
  // Render the appropriate tab based on activeTab state
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileAnalysisTab />;
      case 'company':
        return <CompanyAnalysisTab />;
      case 'message':
        return <MessageAnalysisTab />;
      case 'saved':
        return <SavedAnalysesTab />;
      case 'dashboard':
        return <DashboardTab />;
      case 'settings':
        return <SettingsTab />;
      case 'help':
        return <HelpSupportTab />;
      default:
        return <ProfileAnalysisTab />;
    }
  };
  
  return (
    <ChakraProvider theme={theme}>
      <MainLayout>
        <Suspense fallback={
          <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="brand.primary"
              size="xl"
            />
          </Box>
        }>
          {renderTabContent()}
        </Suspense>
      </MainLayout>
    </ChakraProvider>
  );
}

export default App;