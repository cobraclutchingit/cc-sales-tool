import React from 'react';
import { 
  Box, 
  Heading, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Icon,
  HStack
} from '@chakra-ui/react';
import { FiCpu, FiSliders, FiGlobe, FiDatabase } from 'react-icons/fi';
import ModelSettings from '../components/settings/ModelSettings';

const SettingsTab = () => {
  return (
    <Box>
      <Heading size="lg" mb="6">Settings</Heading>
      
      <Tabs variant="enclosed" colorScheme="purple">
        <TabList>
          <Tab>
            <HStack>
              <Icon as={FiCpu} mr="2" />
              <span>AI Models</span>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={FiSliders} mr="2" />
              <span>Interface</span>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={FiGlobe} mr="2" />
              <span>API</span>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={FiDatabase} mr="2" />
              <span>Data Storage</span>
            </HStack>
          </Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <ModelSettings />
          </TabPanel>
          <TabPanel>
            <Box p={5}>Interface settings coming soon...</Box>
          </TabPanel>
          <TabPanel>
            <Box p={5}>API settings coming soon...</Box>
          </TabPanel>
          <TabPanel>
            <Box p={5}>Data storage settings coming soon...</Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default SettingsTab;