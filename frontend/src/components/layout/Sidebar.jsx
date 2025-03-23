import React from 'react';
import { 
  Box, 
  VStack, 
  Flex, 
  Text, 
  Icon, 
  Divider,
  Button,
  useColorModeValue,
  Tooltip
} from '@chakra-ui/react';
import { 
  FiUser, 
  FiUsers, 
  FiMessageSquare, 
  FiStar, 
  FiPieChart, 
  FiSettings, 
  FiHelpCircle,
  FiChevronLeft, 
  FiChevronRight 
} from 'react-icons/fi';
import useStore from '../../store';

const SidebarItem = ({ icon, children, isActive, onClick }) => {
  const bgActive = useColorModeValue('brand.primary', 'brand.secondary');
  const bgHover = useColorModeValue('gray.100', 'gray.700');
  const textActive = useColorModeValue('white', 'white');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <Flex
      align="center"
      px="4"
      py="3"
      cursor="pointer"
      role="group"
      fontWeight="semibold"
      transition=".15s ease"
      color={isActive ? textActive : textColor}
      bg={isActive ? bgActive : 'transparent'}
      borderRadius="md"
      _hover={{
        bg: isActive ? bgActive : bgHover,
        color: isActive ? textActive : useColorModeValue('brand.primary', 'white'),
      }}
      onClick={onClick}
    >
      <Icon 
        mr="3" 
        fontSize="16" 
        as={icon} 
        _groupHover={{
          color: isActive ? textActive : useColorModeValue('brand.primary', 'white'),
        }}
      />
      {children}
    </Flex>
  );
};

const Sidebar = () => {
  const { 
    activeTab, 
    setActiveTab, 
    sidebarOpen,
    toggleSidebar,
    colorMode
  } = useStore();
  
  const bgColor = useColorModeValue('brand.sidebar.light', 'brand.sidebar.dark');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="sticky"
      h="full"
      pb="10"
      overflowX="hidden"
      overflowY="auto"
      bg={bgColor}
      borderRight="1px"
      borderRightColor={borderColor}
      w={sidebarOpen ? "240px" : "60px"}
      transition="width 0.2s"
    >
      <Flex justifyContent="space-between" alignItems="center" px="4" py="4">
        {sidebarOpen && (
          <Text
            fontSize="2xl"
            ml="2"
            color={useColorModeValue('brand.primary', 'white')}
            fontWeight="semibold"
          >
            VigilantEx
          </Text>
        )}
        <Tooltip label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
          <Button 
            variant="ghost" 
            onClick={toggleSidebar}
            display="flex"
            alignItems="center"
            justifyContent="center"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            size="sm"
          >
            <Icon as={sidebarOpen ? FiChevronLeft : FiChevronRight} />
          </Button>
        </Tooltip>
      </Flex>
      <Divider borderColor={borderColor} />
      <VStack spacing="1" align="stretch" px="2" py="4">
        <SidebarItem 
          icon={FiUser} 
          isActive={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')}
        >
          {sidebarOpen && 'Profile Analysis'}
        </SidebarItem>
        <SidebarItem 
          icon={FiUsers} 
          isActive={activeTab === 'company'} 
          onClick={() => setActiveTab('company')}
        >
          {sidebarOpen && 'Company Analysis'}
        </SidebarItem>
        <SidebarItem 
          icon={FiMessageSquare} 
          isActive={activeTab === 'message'} 
          onClick={() => setActiveTab('message')}
        >
          {sidebarOpen && 'Message Analysis'}
        </SidebarItem>
        <Divider borderColor={borderColor} my="4" />
        <SidebarItem 
          icon={FiStar} 
          isActive={activeTab === 'saved'} 
          onClick={() => setActiveTab('saved')}
        >
          {sidebarOpen && 'Saved Analyses'}
        </SidebarItem>
        <SidebarItem 
          icon={FiPieChart} 
          isActive={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')}
        >
          {sidebarOpen && 'Dashboard'}
        </SidebarItem>
        <Divider borderColor={borderColor} my="4" />
        <SidebarItem 
          icon={FiSettings} 
          isActive={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          {sidebarOpen && 'Settings'}
        </SidebarItem>
        <SidebarItem 
          icon={FiHelpCircle} 
          isActive={activeTab === 'help'} 
          onClick={() => setActiveTab('help')}
        >
          {sidebarOpen && 'Help & Support'}
        </SidebarItem>
      </VStack>
    </Box>
  );
};

export default Sidebar;