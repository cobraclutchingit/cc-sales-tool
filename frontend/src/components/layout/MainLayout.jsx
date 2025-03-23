import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import Header from './Header';
import Sidebar from './Sidebar';
import useStore from '../../store';

const MainLayout = ({ children }) => {
  const { sidebarOpen } = useStore();
  const bgColor = useColorModeValue('brand.background.light', 'brand.background.dark');

  return (
    <Box minH="100vh" bg={bgColor}>
      <Sidebar />
      <Header />
      <Box
        ml={sidebarOpen ? '240px' : '60px'}
        transition="margin-left 0.2s"
        pt="20" // Account for the header
        px="6"
        pb="6"
        minH="calc(100vh - 80px)"
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;