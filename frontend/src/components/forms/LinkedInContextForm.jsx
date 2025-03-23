import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FiSend, FiInfo } from 'react-icons/fi';
import apiService from '../../services/apiService';

/**
 * Form component for sending LinkedIn URL and context to AI processor
 */
const LinkedInContextForm = ({ type = 'profile', onSubmitSuccess }) => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [context, setContext] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [optimizedContext, setOptimizedContext] = useState('');
  const toast = useToast();

  // Optimize the user's context for better AI results
  const handleOptimizeContext = async () => {
    if (!context.trim()) {
      toast({
        title: 'Context required',
        description: 'Please provide some context about this prospect or your sales goals.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await apiService.optimizePrompt(context);
      setOptimizedContext(result.optimizedPrompt);
      toast({
        title: 'Context optimized',
        description: 'Your context has been optimized for better AI research results.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Optimization failed',
        description: error.message || 'Failed to optimize context. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Send the data to AI processor
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!linkedinUrl.trim()) {
      toast({
        title: 'URL required',
        description: 'Please provide a LinkedIn URL.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSending(true);
    try {
      // Use optimized context if available, otherwise use original
      const contextToSend = optimizedContext || context;
      
      const result = await apiService.sendToAIProcessor(linkedinUrl, contextToSend, type);
      
      toast({
        title: 'Request sent',
        description: 'Your LinkedIn analysis request has been sent.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Call the success callback with the result
      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
      
      // Reset form
      setLinkedinUrl('');
      setContext('');
      setOptimizedContext('');
    } catch (error) {
      toast({
        title: 'Request failed',
        description: error.message || 'Failed to send LinkedIn analysis request. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>LinkedIn {type === 'profile' ? 'Profile' : 'Company'} URL</FormLabel>
            <Input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder={`https://www.linkedin.com/${type === 'profile' ? 'in/username' : 'company/name'}`}
              isDisabled={isSending}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              <HStack>
                <Text>Additional Context</Text>
                <Badge colorScheme="purple">Enhances AI results</Badge>
              </HStack>
            </FormLabel>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={`Add details about your sales goals, specific pain points you're addressing, or what you're looking for about this ${type === 'profile' ? 'prospect' : 'company'}...`}
              rows={4}
              isDisabled={isSending || isOptimizing}
            />
            <Button
              mt={2}
              size="sm"
              leftIcon={<FiInfo />}
              onClick={handleOptimizeContext}
              isLoading={isOptimizing}
              loadingText="Optimizing..."
              isDisabled={!context.trim() || isSending}
              variant="outline"
            >
              Optimize Context for AI
            </Button>
          </FormControl>

          {optimizedContext && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Optimized Context</AlertTitle>
                <AlertDescription>
                  <Text fontSize="sm">{optimizedContext}</Text>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          <Button
            type="submit"
            colorScheme="purple"
            isLoading={isSending}
            loadingText="Sending..."
            leftIcon={<FiSend />}
            isDisabled={!linkedinUrl.trim() || isOptimizing}
          >
            Send to AI Processor
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default LinkedInContextForm;