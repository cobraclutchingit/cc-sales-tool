import React from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FiMail, FiLinkedin, FiMessageSquare } from 'react-icons/fi';

/**
 * Output format selector component
 * @param {string} selectedFormat - Currently selected format
 * @param {Function} onChange - Function to call when format changes
 * @returns {JSX.Element} Format selector component
 */
const FormatSelector = ({ selectedFormat, onChange }) => {
  const formats = [
    { id: 'email', label: 'Email', icon: FiMail, description: 'Professional email format' },
    { id: 'linkedin', label: 'LinkedIn', icon: FiLinkedin, description: 'LinkedIn message format' },
    { id: 'phone', label: 'Text Message', icon: FiMessageSquare, description: 'Concise SMS-style message' }
  ];
  
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('brand.primary', 'brand.primary');
  const selectedColor = 'white';
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Box mb={4}>
      <Text fontWeight="medium" mb={2}>Output Format</Text>
      <Flex 
        borderWidth="1px" 
        borderRadius="md" 
        borderColor={borderColor}
        overflow="hidden"
      >
        {formats.map(format => (
          <Button
            key={format.id}
            flex="1"
            py={6}
            variant="ghost"
            borderRadius="0"
            onClick={() => onChange(format.id)}
            bg={selectedFormat === format.id ? selectedBg : bgColor}
            color={selectedFormat === format.id ? selectedColor : 'inherit'}
            _hover={{
              bg: selectedFormat === format.id ? selectedBg : useColorModeValue('gray.100', 'gray.600')
            }}
            height="auto"
            position="relative"
            borderRightWidth={format.id !== 'phone' ? '1px' : '0'}
            borderRightColor={borderColor}
          >
            <Flex direction="column" align="center" justify="center" width="100%">
              <Icon as={format.icon} fontSize="24px" mb={2} />
              <Text fontWeight="medium">{format.label}</Text>
              <Text fontSize="xs" mt={1} opacity="0.8">{format.description}</Text>
            </Flex>
          </Button>
        ))}
      </Flex>
    </Box>
  );
};

export default FormatSelector;