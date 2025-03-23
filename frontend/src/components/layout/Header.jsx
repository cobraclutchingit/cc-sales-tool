import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  useColorMode,
  Avatar,
  Badge,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiBell,
  FiChevronDown,
  FiMoon,
  FiSun,
  FiSearch,
  FiInbox,
  FiLogOut,
  FiUser,
  FiSettings,
} from 'react-icons/fi';
import useStore from '../../store';

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { sidebarOpen } = useStore();
  
  const bgColor = useColorModeValue('brand.navbar.light', 'brand.navbar.dark');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      as="header"
      position="fixed"
      top="0"
      zIndex="1"
      bg={bgColor}
      width={`calc(100% - ${sidebarOpen ? '240px' : '60px'})`}
      ml={sidebarOpen ? '240px' : '60px'}
      transition="margin-left 0.2s, width 0.2s"
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      py="2"
      px="4"
    >
      <Flex h="16" alignItems="center" justifyContent="space-between">
        <HStack spacing="4" alignItems="center">
          <Text
            fontSize="xl"
            fontWeight="bold"
            display={{ base: 'none', md: 'flex' }}
            color={useColorModeValue('brand.primary', 'brand.secondary')}
          >
            Sales Automation
          </Text>
          
          <InputGroup w={{ base: '100%', md: '320px' }} ml="4">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Search prospects, companies..." 
              variant="filled"
              bg={useColorModeValue('gray.100', 'gray.700')}
              _hover={{
                bg: useColorModeValue('gray.200', 'gray.600')
              }}
              _focus={{
                bg: useColorModeValue('white', 'gray.800'),
                borderColor: 'brand.primary'
              }}
            />
          </InputGroup>
        </HStack>
        
        <HStack spacing="4">
          <Tooltip label="Toggle color mode">
            <IconButton
              size="md"
              fontSize="lg"
              aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
              variant="ghost"
              color={useColorModeValue('gray.600', 'gray.300')}
              onClick={toggleColorMode}
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            />
          </Tooltip>
          
          <Tooltip label="Notifications">
            <IconButton
              size="md"
              fontSize="lg"
              aria-label="View notifications"
              variant="ghost"
              color={useColorModeValue('gray.600', 'gray.300')}
              icon={
                <Box position="relative">
                  <FiBell />
                  <Badge
                    position="absolute"
                    top="-6px"
                    right="-6px"
                    fontSize="0.6em"
                    colorScheme="red"
                    borderRadius="full"
                  >
                    3
                  </Badge>
                </Box>
              }
            />
          </Tooltip>
          
          <Tooltip label="Messages">
            <IconButton
              size="md"
              fontSize="lg"
              aria-label="View messages"
              variant="ghost"
              color={useColorModeValue('gray.600', 'gray.300')}
              icon={
                <Box position="relative">
                  <FiInbox />
                  <Badge
                    position="absolute"
                    top="-6px"
                    right="-6px"
                    fontSize="0.6em"
                    colorScheme="blue"
                    borderRadius="full"
                  >
                    5
                  </Badge>
                </Box>
              }
            />
          </Tooltip>
          
          <Menu>
            <MenuButton
              as={Button}
              rounded="full"
              variant="link"
              cursor="pointer"
              minW={0}
            >
              <HStack spacing="2">
                <Avatar
                  size="sm"
                  name="Sales Admin"
                  src="https://bit.ly/broken-link"
                  bg="brand.primary"
                />
                <Text display={{ base: 'none', md: 'flex' }}>Sales Admin</Text>
                <FiChevronDown />
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />}>Profile</MenuItem>
              <MenuItem icon={<FiSettings />}>Settings</MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />}>Sign out</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;