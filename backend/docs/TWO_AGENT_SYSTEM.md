# Two-Agent System for Personalized Sales Content Generation

This document outlines the architecture and usage of the two-agent system for generating highly personalized sales content for VigilantEx's construction site surveillance solutions.

## Overview

The two-agent system consists of:

1. **Fine-Tuning Agent** (using OpenAI's gpt-4o-mini) - Researches prospects and prepares tailored prompts
2. **Sales Copy Generation Agent** (using Anthropic's Claude 3 Opus) - Creates personalized, high-quality sales content

This approach leverages the strengths of both models to create better results than either could achieve independently.

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ LinkedIn    │    │ Company     │    │ Role        │    │ Industry    │
│ Profile     │───►│ Research    │───►│ Analysis    │───►│ Trends      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
        │                 │                 │                   │
        │                 ▼                 ▼                   ▼
        │           ┌─────────────────────────────────────────┐
        └──────────►│ Fine-Tuning Agent                       │
                    │ (GPT-4o-mini)                           │
                    └─────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────────┐
                    │ Sales Copy Generation Agent             │
                    │ (Claude 3 Opus)                         │
                    └─────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────────┐
                    │ Personalized Sales Content              │
                    └─────────────────────────────────────────┘
```

## Key Components

- **twoAgentService.js**: Coordinates the workflow between agents
- **researchService.js**: Gathers company and role information
- **prompt-formatter.js**: Formats data for agent prompts
- **agentController.js**: Handles API requests
- **config/agent-prompts.js**: Contains system prompts and templates
- **webFetchTool.js**: Fetches and processes web content

## API Endpoints

The two-agent system exposes the following endpoints:

- `POST /api/agent/generate`: Generate personalized content using the complete two-agent system
- `POST /api/agent/test-fine-tuning`: Test only the fine-tuning agent
- `POST /api/agent/test-sales-copy`: Test only the sales copy agent

### Generate Content Example

```javascript
// Request
POST /api/agent/generate
Content-Type: application/json

{
  "profileData": {
    "name": "John Smith",
    "title": "Safety Director",
    "company": "ABC Construction",
    "experience": [
      {
        "title": "Safety Director",
        "company": "ABC Construction",
        "duration": "2018 - Present"
      }
    ],
    "interests": ["Construction Safety", "OSHA Compliance"]
  },
  "additionalContext": {
    "notes": "Met John at the Construction Safety Conference last month."
  },
  "outputType": "sales_email",
  "options": {
    "fineTuningModel": "gpt-4o-mini",
    "salesCopyModel": "claude-3-opus-20240229"
  }
}

// Response
{
  "success": true,
  "data": {
    "content": "...", // Generated content
    "metadata": {
      "profile": {
        "name": "John Smith",
        "title": "Safety Director",
        "company": "ABC Construction"
      },
      "researchSummary": {
        "companySize": "medium",
        "industryFocus": "commercial construction",
        "roleCategory": "safety_director",
        "painPoints": [...]
      },
      "outputType": "sales_email",
      "process": {
        "fineTuningPrompt": "...",
        "fineTuningOutput": "...",
        "salesCopyPrompt": "..."
      }
    }
  }
}
```

## Supported Output Types

- `sales_email`: Professional sales email
- `linkedin_connection`: LinkedIn connection request
- `linkedin_message`: LinkedIn direct message
- `linkedin_post`: LinkedIn post mentioning the prospect
- `follow_up_email`: Email after initial contact
- `after_demo_email`: Follow-up email after product demo
- `text_message`: Brief SMS message

## Role Customization

The system automatically analyzes job titles and maps them to standardized role categories:

- `pre_construction_manager`: Pre-construction and planning roles
- `operations_director`: Operations and management roles
- `safety_director`: Safety, compliance, and risk management roles
- `project_executive`: Executive leadership and project oversight roles
- `site_superintendent`: On-site supervision roles

Each role category has specific pain points and benefits that are incorporated into the generated content.

## Testing

To test the two-agent system:

```
node tests/two-agent-test.js
```

This script tests the complete workflow from research to content generation.

## Fallback Mechanisms

The system includes robust fallback mechanisms:

1. If the fine-tuning agent fails, the system can generate content using only the sales copy agent
2. If there are API issues, the system can fall back to different models
3. If company research fails, the system uses default industry information

## Future Enhancements

Planned enhancements include:

1. Integration with real web search APIs for company research
2. Additional output formats and templates
3. User feedback mechanisms to improve generations
4. Frontend interface for interacting with the system
5. Monitoring and analytics for tracking system performance