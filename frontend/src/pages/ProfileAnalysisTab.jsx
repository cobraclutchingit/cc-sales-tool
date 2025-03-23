import React, { useState } from 'react';
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
  Radio, 
  RadioGroup, 
  Divider,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
  Flex,
  Icon,
  Tooltip
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
  FiBriefcase
} from 'react-icons/fi';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AIVisualization from '../components/visualization/AIVisualization';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useStore from '../store';

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
  
  const [additionalContext, setAdditionalContext] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    analyzeProfile();
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
                {!profileLoading && (
                  <Tooltip label="Start with a blank form">
                    <Button variant="outline" size="sm" leftIcon={<FiFileText />} onClick={() => setProfileUrl('')}>
                      New
                    </Button>
                  </Tooltip>
                )}
              </Flex>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>LinkedIn Profile URL</FormLabel>
                    <Input
                      type="url"
                      value={profileUrl}
                      onChange={(e) => setProfileUrl(e.target.value)}
                      placeholder="https://www.linkedin.com/in/username"
                      leftIcon={<FiLink />}
                      isDisabled={profileLoading}
                    />
                  </FormControl>
                  
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
                  
                  <FormControl>
                    <FormLabel>Output Format</FormLabel>
                    <RadioGroup value={outputFormat} onChange={setOutputFormat}>
                      <HStack spacing={4}>
                        <Radio value="email" isDisabled={profileLoading}>Email</Radio>
                        <Radio value="linkedin" isDisabled={profileLoading}>LinkedIn Message</Radio>
                        <Radio value="phone" isDisabled={profileLoading}>Phone Script</Radio>
                      </HStack>
                    </RadioGroup>
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
                    <AIVisualization activeTab="profile" />
                    <OrbitControls enableZoom={false} enablePan={false} />
                  </Canvas>
                )}
              </Box>
              <CardBody>
                <Text fontWeight="medium" textAlign="center">
                  {processingStage === 'idle' && 'Ready to analyze LinkedIn profile'}
                  {processingStage === 'loading' && 'Collecting profile data...'}
                  {processingStage === 'analyzing' && 'Analyzing professional background...'}
                  {processingStage === 'generating' && 'Generating personalized content...'}
                  {processingStage === 'complete' && 'Analysis complete'}
                </Text>
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
                        <Text>{profileData.location}</Text>
                      </GridItem>
                    </Grid>
                    
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
                    
                    <Divider />
                    
                    <Box>
                      <HStack justifyContent="space-between" mb="2">
                        <Text fontWeight="bold">Generated Content:</Text>
                        <Badge colorScheme="blue">
                          {outputFormat === 'email' && 'Email Format'}
                          {outputFormat === 'linkedin' && 'LinkedIn Message'}
                          {outputFormat === 'phone' && 'Phone Script'}
                        </Badge>
                      </HStack>
                      <Box 
                        p="3" 
                        borderWidth="1px" 
                        borderRadius="md" 
                        borderColor={borderColor}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        fontFamily="mono"
                        fontSize="sm"
                        whiteSpace="pre-wrap"
                      >
                        {profileContent}
                      </Box>
                      <Button 
                        mt="3" 
                        leftIcon={<FiCopy />} 
                        onClick={() => copyToClipboard(profileContent)}
                        colorScheme="blue"
                        size="sm"
                      >
                        Copy to Clipboard
                      </Button>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default ProfileAnalysisTab;