import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  GridItem, 
  Heading, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea,
  Button, 
  VStack, 
  HStack, 
  Card, 
  CardHeader, 
  CardBody, 
  Text, 
  Badge, 
  Divider,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
  Flex,
  Icon,
  Tooltip,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import { 
  FiUser, 
  FiLink, 
  FiSend, 
  FiCopy, 
  FiInfo, 
  FiCheck, 
  FiSave, 
  FiAlertTriangle,
  FiBookmark,
  FiFileText,
  FiBriefcase,
  FiCpu,
  FiSettings
} from 'react-icons/fi';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AIVisualization from '../components/visualization/AIVisualization';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FormatSelector from '../components/common/FormatSelector';
import ContentPreview from '../components/common/ContentPreview';
import useStore from '../store';
import useModelSettings from '../hooks/useModelSettings';

const ProfileAnalysisTab = () => {
  const {
    profileUrl,
    setProfileUrl,
    profileData,
    profileContent,
    profileLoading,
    profileError,
    analyzeProfile,
    outputFormat,
    setOutputFormat,
    processingStage,
    saveAnalysis
  } = useStore();
  
  // Get model settings
  const { getModelOptions } = useModelSettings();
  
  // Local state
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedMetadata, setGeneratedMetadata] = useState(null);
  
  // Create a custom analyze function that uses the model settings and additional context
  const handleAnalysis = () => {
    const modelOptions = getModelOptions();
    analyzeProfile(additionalContext, modelOptions);
  };
  
  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Content copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  // Update local storage when profile data changes
  useEffect(() => {
    if (profileData?.metadata) {
      setGeneratedMetadata(profileData.metadata);
    }
  }, [profileData]);
  
  const cardBg = useColorModeValue('white', 'brand.card.dark');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box>
      <Heading size="lg" mb="6">LinkedIn Profile Analysis</Heading>
      
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Input Section */}
        <GridItem>
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardHeader>
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md">
                  <Icon as={FiUser} mr="2" />
                  Profile Input
                </Heading>
                <HStack>
                  {!profileLoading && (
                    <Tooltip label="Start with a blank form">
                      <Button variant="outline" size="sm" leftIcon={<FiFileText />} onClick={() => setProfileUrl('')}>
                        New
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip label="Configure AI models">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      leftIcon={<FiSettings />} 
                      onClick={() => useStore.getState().setActiveTab('settings')}
                    >
                      Models
                    </Button>
                  </Tooltip>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody>
              <form onSubmit={(e) => { e.preventDefault(); handleAnalysis(); }}>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>LinkedIn Profile URL</FormLabel>
                    <Input
                      type="url"
                      value={profileUrl}
                      onChange={(e) => setProfileUrl(e.target.value)}
                      placeholder="https://www.linkedin.com/in/username"
                      isDisabled={profileLoading}
                    />
                  </FormControl>
                  
                  {/* Format Selector Component */}
                  <FormatSelector 
                    selectedFormat={outputFormat} 
                    onChange={setOutputFormat} 
                  />
                  
                  <FormControl>
                    <FormLabel>Additional Context (Optional)</FormLabel>
                    <Textarea
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="Add any additional context about this prospect or your goals for the outreach..."
                      rows={4}
                      isDisabled={profileLoading}
                    />
                  </FormControl>
                  
                  <Button
                    type="submit"
                    colorScheme="purple"
                    isLoading={profileLoading}
                    loadingText={
                      processingStage === 'loading' ? 'Collecting data...' :
                      processingStage === 'analyzing' ? 'Analyzing profile...' :
                      processingStage === 'generating' ? 'Generating content...' :
                      'Processing...'
                    }
                    leftIcon={<FiSend />}
                    isDisabled={!profileUrl || profileLoading}
                  >
                    Generate Content
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </GridItem>
        
        {/* Visualization and Results Section */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            {/* AI Visualization */}
            <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
              <Box height="250px" bg="gray.900" position="relative">
                {profileLoading ? (
                  <Box position="absolute" top="0" left="0" right="0" bottom="0" display="flex" alignItems="center" justifyContent="center">
                    <LoadingSpinner />
                  </Box>
                ) : (
                  <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <AIVisualization activeTab="profile" stage={processingStage} />
                    <OrbitControls enableZoom={false} enablePan={false} />
                  </Canvas>
                )}
              </Box>
              <CardBody>
                <Box textAlign="center">
                  {processingStage === 'idle' && (
                    <Text fontWeight="medium">Ready to analyze LinkedIn profile</Text>
                  )}
                  {processingStage === 'loading' && (
                    <Text fontWeight="medium">Collecting profile data...</Text>
                  )}
                  {processingStage === 'analyzing' && (
                    <Text fontWeight="medium">Researching role and company...</Text>
                  )}
                  {processingStage === 'generating' && (
                    <Text fontWeight="medium">Creating personalized content...</Text>
                  )}
                  {processingStage === 'complete' && (
                    <HStack justifyContent="center" spacing={1}>
                      <Icon as={FiCheck} color="green.500" />
                      <Text fontWeight="medium" color="green.500">Analysis complete</Text>
                    </HStack>
                  )}
                </Box>
              </CardBody>
            </Card>
            
            {/* Error Message */}
            {profileError && (
              <Card bg="red.50" borderColor="red.300" borderWidth="1px" shadow="md" borderRadius="lg">
                <CardBody>
                  <HStack>
                    <Icon as={FiAlertTriangle} color="red.500" />
                    <Text color="red.500">{profileError}</Text>
                  </HStack>
                </CardBody>
              </Card>
            )}
            
            {/* Results Preview (only shown when data is available) */}
            {profileData && profileContent && (
              <VStack spacing={6} align="stretch">
                {/* Generated Content Preview */}
                <Card bg={cardBg} shadow="md" borderRadius="lg">
                  <CardHeader>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Heading size="md">
                        <Icon as={FiFileText} mr="2" />
                        Generated Content
                      </Heading>
                      <Button size="sm" leftIcon={<FiCopy />} onClick={() => copyToClipboard(profileContent)}>
                        Copy
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <ContentPreview 
                      content={profileContent} 
                      outputFormat={outputFormat}
                      profileData={profileData}
                    />
                  </CardBody>
                </Card>
                
                {/* Profile Insights */}
                <Card bg={cardBg} shadow="md" borderRadius="lg">
                  <CardHeader>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Heading size="md">
                        <Icon as={FiBriefcase} mr="2" />
                        Profile Insights
                      </Heading>
                      <Button size="sm" leftIcon={<FiBookmark />} onClick={saveAnalysis}>
                        Save Analysis
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                        <GridItem>
                          <Text fontWeight="bold">Name:</Text>
                          <Text>{profileData.name}</Text>
                        </GridItem>
                        <GridItem>
                          <Text fontWeight="bold">Title:</Text>
                          <Text>{profileData.title}</Text>
                        </GridItem>
                        <GridItem>
                          <Text fontWeight="bold">Company:</Text>
                          <Text>{profileData.company}</Text>
                        </GridItem>
                        <GridItem>
                          <Text fontWeight="bold">Location:</Text>
                          <Text>{profileData.location || 'Not specified'}</Text>
                        </GridItem>
                      </Grid>
                      
                      {profileData.experience && profileData.experience.length > 0 && (
                        <>
                          <Divider />
                          <Box>
                            <Text fontWeight="bold" mb="2">Experience:</Text>
                            <List spacing={2}>
                              {profileData.experience.map((exp, index) => (
                                <ListItem key={index}>
                                  <ListIcon as={FiCheck} color="brand.primary" />
                                  {exp.title} at {exp.company} ({exp.duration})
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </>
                      )}
                      
                      {profileData.interests && profileData.interests.length > 0 && (
                        <>
                          <Divider />
                          <Box>
                            <Text fontWeight="bold" mb="2">Interests:</Text>
                            <Flex flexWrap="wrap" gap="2">
                              {profileData.interests.map((interest, index) => (
                                <Badge key={index} colorScheme="purple" px="2" py="1" borderRadius="md">
                                  {interest}
                                </Badge>
                              ))}
                            </Flex>
                          </Box>
                        </>
                      )}
                      
                      {/* Two-Agent System Metadata (if available) */}
                      {generatedMetadata && (
                        <>
                          <Divider />
                          <Accordion allowToggle>
                            <AccordionItem border="none">
                              <AccordionButton px={0}>
                                <HStack flex="1" textAlign="left">
                                  <Icon as={FiCpu} color="brand.primary" />
                                  <Text fontWeight="bold">AI Analysis Details</Text>
                                </HStack>
                                <AccordionIcon />
                              </AccordionButton>
                              <AccordionPanel>
                                <VStack align="stretch" spacing={3}>
                                  {generatedMetadata.researchSummary && (
                                    <Box>
                                      <Text fontWeight="bold" fontSize="sm">Research Summary:</Text>
                                      <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={2} mt={2}>
                                        <Box>
                                          <Text fontSize="xs" color="gray.500">Company Size:</Text>
                                          <Text fontSize="sm">{generatedMetadata.researchSummary.companySize}</Text>
                                        </Box>
                                        <Box>
                                          <Text fontSize="xs" color="gray.500">Industry Focus:</Text>
                                          <Text fontSize="sm">{generatedMetadata.researchSummary.industryFocus}</Text>
                                        </Box>
                                        <Box>
                                          <Text fontSize="xs" color="gray.500">Role Category:</Text>
                                          <Text fontSize="sm">{generatedMetadata.researchSummary.roleCategory}</Text>
                                        </Box>
                                      </Grid>
                                      
                                      {generatedMetadata.researchSummary.painPoints && generatedMetadata.researchSummary.painPoints.length > 0 && (
                                        <Box mt={3}>
                                          <Text fontSize="xs" color="gray.500">Key Pain Points:</Text>
                                          <Flex flexWrap="wrap" gap={2} mt={1}>
                                            {generatedMetadata.researchSummary.painPoints.map((point, idx) => (
                                              <Badge key={idx} colorScheme="blue" size="sm">
                                                {point}
                                              </Badge>
                                            ))}
                                          </Flex>
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                  
                                  <Divider />
                                  
                                  <HStack justifyContent="space-between">
                                    <Text fontSize="xs" color="gray.500">
                                      <Icon as={FiInfo} mr={1} />
                                      Two-agent system used for content generation
                                    </Text>
                                    <Badge colorScheme="purple" size="sm">
                                      {generatedMetadata.outputType || outputFormat}
                                    </Badge>
                                  </HStack>
                                </VStack>
                              </AccordionPanel>
                            </AccordionItem>
                          </Accordion>
                        </>
                      )}
                      
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default ProfileAnalysisTab;