import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  RadioGroup,
  Radio,
  VStack,
  HStack,
  Badge,
  Divider,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FiCpu, FiAward, FiBriefcase, FiClock, FiDollarSign } from 'react-icons/fi';
import useModelSettings from '../../hooks/useModelSettings';

/**
 * Model settings component
 * @returns {JSX.Element} Model settings component
 */
const ModelSettings = () => {
  const {
    fineTuningModels,
    salesCopyModels,
    selectedFineTuner,
    selectedSalesCopy,
    setSelectedFineTuner,
    setSelectedSalesCopy
  } = useModelSettings();

  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const qualityBg = 'purple.100';
  const qualityColor = 'purple.800';
  const speedBg = 'blue.100';
  const speedColor = 'blue.800';
  const costBg = 'green.100';
  const costColor = 'green.800';
  
  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Fine-Tuning Agent Section */}
        <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
          <CardHeader bg={headerBg} py={4}>
            <HStack>
              <Icon as={FiCpu} fontSize="24px" color="brand.primary" />
              <Heading size="md">Fine-Tuning Agent</Heading>
            </HStack>
            <Text mt={2} fontSize="sm" color="gray.500">
              The fine-tuning agent analyzes prospect data and prepares tailored prompts. 
              This agent works behind the scenes to create a personalized content strategy.
            </Text>
          </CardHeader>
          <CardBody>
            <RadioGroup value={selectedFineTuner} onChange={setSelectedFineTuner}>
              <VStack spacing={4} align="stretch">
                {fineTuningModels.map(model => (
                  <Box
                    key={model.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={selectedFineTuner === model.id ? 'brand.primary' : 'gray.200'}
                    bg={selectedFineTuner === model.id ? useColorModeValue('brand.primaryLight', 'gray.700') : 'transparent'}
                  >
                    <Radio value={model.id} mb={2}>
                      <HStack>
                        <Text fontWeight="bold">{model.label}</Text>
                        {model.default && (
                          <Badge colorScheme="green">Recommended</Badge>
                        )}
                      </HStack>
                    </Radio>
                    <Text fontSize="sm" ml={6} mb={3}>
                      {model.description}
                    </Text>
                    
                    <HStack ml={6} spacing={3}>
                      {model.id.includes('4o') && !model.id.includes('mini') && (
                        <Badge bg={qualityBg} color={qualityColor}>
                          <HStack spacing={1}>
                            <Icon as={FiAward} />
                            <Text>Best Quality</Text>
                          </HStack>
                        </Badge>
                      )}
                      {model.id.includes('mini') && (
                        <Badge bg={speedBg} color={speedColor}>
                          <HStack spacing={1}>
                            <Icon as={FiClock} />
                            <Text>Fast</Text>
                          </HStack>
                        </Badge>
                      )}
                      {(model.id.includes('mini') || model.id.includes('3.5')) && (
                        <Badge bg={costBg} color={costColor}>
                          <HStack spacing={1}>
                            <Icon as={FiDollarSign} />
                            <Text>Cost-Effective</Text>
                          </HStack>
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </RadioGroup>
          </CardBody>
        </Card>
        
        {/* Sales Copy Agent Section */}
        <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
          <CardHeader bg={headerBg} py={4}>
            <HStack>
              <Icon as={FiBriefcase} fontSize="24px" color="brand.primary" />
              <Heading size="md">Sales Copy Agent</Heading>
            </HStack>
            <Text mt={2} fontSize="sm" color="gray.500">
              The sales copy agent creates the final personalized content. 
              This is the creative writer that crafts persuasive messages based on the fine-tuning agent's instructions.
            </Text>
          </CardHeader>
          <CardBody>
            <RadioGroup value={selectedSalesCopy} onChange={setSelectedSalesCopy}>
              <VStack spacing={4} align="stretch">
                {salesCopyModels.map(model => (
                  <Box
                    key={model.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={selectedSalesCopy === model.id ? 'brand.primary' : 'gray.200'}
                    bg={selectedSalesCopy === model.id ? useColorModeValue('brand.primaryLight', 'gray.700') : 'transparent'}
                  >
                    <Radio value={model.id} mb={2}>
                      <HStack>
                        <Text fontWeight="bold">{model.label}</Text>
                        {model.default && (
                          <Badge colorScheme="green">Recommended</Badge>
                        )}
                      </HStack>
                    </Radio>
                    <Text fontSize="sm" ml={6} mb={3}>
                      {model.description}
                    </Text>
                    
                    <HStack ml={6} spacing={3}>
                      {model.id.includes('opus') && (
                        <Badge bg={qualityBg} color={qualityColor}>
                          <HStack spacing={1}>
                            <Icon as={FiAward} />
                            <Text>Premium Quality</Text>
                          </HStack>
                        </Badge>
                      )}
                      {model.id.includes('haiku') && (
                        <Badge bg={speedBg} color={speedColor}>
                          <HStack spacing={1}>
                            <Icon as={FiClock} />
                            <Text>Fastest</Text>
                          </HStack>
                        </Badge>
                      )}
                      {model.id.includes('haiku') && (
                        <Badge bg={costBg} color={costColor}>
                          <HStack spacing={1}>
                            <Icon as={FiDollarSign} />
                            <Text>Most Economical</Text>
                          </HStack>
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </RadioGroup>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default ModelSettings;