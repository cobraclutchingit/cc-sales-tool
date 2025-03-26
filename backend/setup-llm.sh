#!/bin/bash
# LLM Integration Setup Script
# This script sets up the LLM integration by installing dependencies,
# configuring environment variables, and running diagnostics.

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print header
echo -e "${MAGENTA}========================================"
echo -e "VigilantEx LLM Integration Setup"
echo -e "========================================${NC}"
echo

# Check if we're in the backend directory
if [ ! -f "server.js" ]; then
  echo -e "${RED}Error: This script must be run from the backend directory${NC}"
  echo -e "Please navigate to the backend directory and run the script again"
  exit 1
fi

# Step 1: Install dependencies
echo -e "${BLUE}Step 1: Installing dependencies...${NC}"
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm is not installed${NC}"
  echo -e "Please install Node.js and npm first"
  exit 1
fi

echo -e "${CYAN}Installing OpenAI SDK...${NC}"
npm install @openai/openai --save

echo -e "${CYAN}Installing Anthropic SDK...${NC}"
npm install @anthropic-ai/sdk --save

echo -e "${CYAN}Installing dotenv for environment variables...${NC}"
npm install dotenv --save

echo -e "${CYAN}Installing additional utilities...${NC}"
npm install fs-extra

echo -e "${GREEN}Dependencies installed successfully!${NC}"
echo

# Step 2: Verify environment variables
echo -e "${BLUE}Step 2: Configuring environment variables...${NC}"
echo

# Check if .env file exists and contains the necessary variables
echo -e "${CYAN}Updating environment variables...${NC}"
node utils/update-env-models.js
echo

# Step 3: Create necessary directories
echo -e "${BLUE}Step 3: Creating necessary directories...${NC}"
echo

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
  echo -e "${CYAN}Creating logs directory...${NC}"
  mkdir -p logs
  echo -e "${GREEN}Logs directory created${NC}"
else
  echo -e "${GREEN}Logs directory already exists${NC}"
fi

# Create config directory if it doesn't exist
if [ ! -d "config" ]; then
  echo -e "${CYAN}Creating config directory...${NC}"
  mkdir -p config
  echo -e "${GREEN}Config directory created${NC}"
else
  echo -e "${GREEN}Config directory already exists${NC}"
fi

# Step 4: Generate OpenAI models configuration if API key is available
echo -e "${BLUE}Step 4: Generating OpenAI models configuration...${NC}"
echo

# Attempt to run the OpenAI model discovery tool
if [ -f "utils/openai-model-discovery.js" ]; then
  echo -e "${CYAN}Running OpenAI model discovery...${NC}"
  node utils/openai-model-discovery.js
  echo
else
  echo -e "${YELLOW}OpenAI model discovery script not found${NC}"
  echo -e "Using default configuration instead"
  echo
fi

# Step 5: Run diagnostics
echo -e "${BLUE}Step 5: Running diagnostics...${NC}"
echo

# Check if test file exists
if [ -f "tests/multi-llm-test.js" ]; then
  echo -e "${CYAN}Running LLM integration test...${NC}"
  echo -e "${YELLOW}This test will generate sample content to verify API connectivity.${NC}"
  echo -e "${YELLOW}Note: This will use your API quota.${NC}"
  
  # Ask for confirmation
  read -p "Run the integration test? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    node tests/multi-llm-test.js
  else
    echo -e "${YELLOW}Test skipped by user${NC}"
  fi
else
  echo -e "${YELLOW}Integration test file not found${NC}"
fi

# Step 6: Show next steps
echo
echo -e "${MAGENTA}========================================${NC}"
echo -e "${GREEN}LLM Integration Setup Complete!${NC}"
echo -e "${MAGENTA}========================================${NC}"
echo
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Make sure your API keys are correctly configured in your .env file"
echo -e "2. Use the model selector to find the best models for your use case:"
echo -e "   ${CYAN}node utils/model-selector.js${NC}"
echo -e "3. To test the whole sales content pipeline:"
echo -e "   ${CYAN}node tests/multi-llm-test.js${NC}"
echo -e "4. To update model configurations:"
echo -e "   ${CYAN}node utils/openai-model-discovery.js${NC}"
echo -e "5. For detailed documentation, see:"
echo -e "   ${CYAN}LLM_INTEGRATION.md${NC}"
echo
echo -e "Happy generating! 🤖✨"