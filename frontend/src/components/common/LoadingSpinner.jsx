import React from 'react';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import useStore from '../../store';

const LoadingSpinner = ({ message }) => {
  const { processingStage } = useStore();
  
  // Get message based on processingStage if not provided
  const loadingMessage = message || (
    processingStage === 'loading' ? 'Collecting data...' :
    processingStage === 'analyzing' ? 'Analyzing information...' :
    processingStage === 'generating' ? 'Generating content...' :
    'Loading...'
  );
  
  return (
    <Flex justifyContent="center" alignItems="center" height="100%" width="100%">
      <VStack spacing={4}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.primary"
          size="xl"
        />
        {loadingMessage && (
          <Text fontWeight="medium" color="gray.600">
            {loadingMessage}
          </Text>
        )}
      </VStack>
    </Flex>
  );
};

export default LoadingSpinner;