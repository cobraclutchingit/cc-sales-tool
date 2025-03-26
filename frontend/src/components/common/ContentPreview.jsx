import React from 'react';
import {
  Box,
  Text,
  Icon,
  HStack,
  VStack,
  Avatar,
  Flex,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import { FiMail, FiLinkedin, FiMessageSquare, FiUser, FiCheck } from 'react-icons/fi';

/**
 * Content preview component displays content in a format-specific UI
 * @param {string} content - The content to display
 * @param {string} outputFormat - The output format (email, linkedin, phone)
 * @param {Object} profileData - Optional profile data
 * @returns {JSX.Element} Content preview component
 */
const ContentPreview = ({ content, outputFormat, profileData }) => {
  // Extract the first name for use in previews
  const firstName = profileData?.name ? profileData.name.split(' ')[0] : 'User';
  
  // Colors
  const emailHeaderBg = useColorModeValue('gray.100', 'gray.700');
  const emailBodyBg = useColorModeValue('white', 'gray.800');
  const linkedinHeaderBg = useColorModeValue('linkedin.100', 'linkedin.900');
  const linkedinBodyBg = useColorModeValue('white', 'gray.800');
  const messageBubbleBg = useColorModeValue('blue.100', 'blue.700');
  const phoneBodyBg = useColorModeValue('gray.50', 'gray.800');
  const phoneFrameBg = useColorModeValue('gray.300', 'gray.600');
  
  // Email Preview
  if (outputFormat === 'email') {
    // Try to extract subject line
    let subject = 'Subject Line';
    let body = content;
    
    // Check if content starts with a line that looks like a subject
    const lines = content.split('\n');
    if (lines[0] && !lines[0].includes(':') && lines[0].length < 100) {
      subject = lines[0];
      body = lines.slice(1).join('\n').trim();
    }
    
    return (
      <Box borderWidth="1px" borderRadius="md" overflow="hidden">
        <Box p={3} bg={emailHeaderBg}>
          <HStack spacing={2}>
            <Icon as={FiMail} />
            <Text fontWeight="bold">Email Preview</Text>
          </HStack>
          <Box mt={2}>
            <Text fontWeight="medium">To: {profileData?.name || 'Prospect'} &lt;{firstName.toLowerCase()}@{profileData?.company ? profileData.company.toLowerCase().replace(/\s+/g, '') : 'company'}.com&gt;</Text>
            <Text fontWeight="medium">Subject: {subject}</Text>
          </Box>
        </Box>
        <Box p={4} bg={emailBodyBg} whiteSpace="pre-wrap">
          {body}
        </Box>
      </Box>
    );
  }
  
  // LinkedIn Message Preview
  if (outputFormat === 'linkedin') {
    return (
      <Box borderWidth="1px" borderRadius="md" overflow="hidden">
        <Box p={3} bg={linkedinHeaderBg} color="white">
          <HStack spacing={2}>
            <Icon as={FiLinkedin} />
            <Text fontWeight="bold">LinkedIn Message Preview</Text>
          </HStack>
        </Box>
        <Box p={3} bg={linkedinBodyBg}>
          <HStack spacing={3} mb={4}>
            <Avatar size="sm" icon={<FiUser />} bg="gray.300" />
            <Box>
              <Text fontWeight="bold">You</Text>
              <Text fontSize="sm">Your Company</Text>
            </Box>
            <Badge colorScheme="green" ml="auto">
              <HStack spacing={1}>
                <Icon as={FiCheck} fontSize="xs" />
                <Text>Connected</Text>
              </HStack>
            </Badge>
          </HStack>
          <Box p={3} borderWidth="1px" borderRadius="md" whiteSpace="pre-wrap">
            {content}
          </Box>
        </Box>
      </Box>
    );
  }
  
  // Text Message Preview
  if (outputFormat === 'phone') {
    return (
      <Flex justifyContent="center">
        <Box 
          width="300px" 
          borderWidth="8px" 
          borderRadius="30px" 
          borderColor={phoneFrameBg}
          overflow="hidden"
        >
          <Box p={3} bg={phoneBodyBg} height="500px">
            <VStack align="stretch" spacing={4}>
              <HStack justifyContent="center">
                <Text fontWeight="bold">Message to {firstName}</Text>
              </HStack>
              <Flex justify="flex-end" mb={2}>
                <Box 
                  maxWidth="80%" 
                  p={3} 
                  borderRadius="lg" 
                  bg={messageBubbleBg}
                  color={useColorModeValue('gray.800', 'white')}
                  boxShadow="sm"
                >
                  <Text whiteSpace="pre-wrap">{content}</Text>
                </Box>
              </Flex>
            </VStack>
          </Box>
        </Box>
      </Flex>
    );
  }
  
  // Default fallback
  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="md" 
      whiteSpace="pre-wrap"
    >
      {content}
    </Box>
  );
};

export default ContentPreview;