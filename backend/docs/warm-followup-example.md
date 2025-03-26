# Warm Follow-up Email API Usage Guide

This guide demonstrates how to use the warm follow-up email API endpoint to generate personalized follow-up emails after phone calls with prospects.

## API Endpoint

```
POST /api/messages/warm-followup
```

## Request Format

```json
{
  "profileData": {
    "name": "John Smith",
    "title": "Construction Project Manager",
    "company": "ABC Construction",
    "experience": [
      { "title": "Project Manager", "company": "ABC Construction", "duration": "2018 - Present" },
      { "title": "Assistant Project Manager", "company": "XYZ Builders", "duration": "2015 - 2018" }
    ],
    "interests": ["Construction Safety", "Project Management", "Technology"]
  },
  "callDetails": {
    "duration": "20 minutes",
    "topics": ["surveillance system capabilities", "implementation process", "cost structure"],
    "concerns": "ROI and implementation timeline",
    "nextSteps": "product demonstration next week",
    "demoDate": "Tuesday, March 30th at 2:00 PM"
  }
}
```

### Required Fields

#### profileData
- `name` (required): The prospect's full name
- `title` (required): The prospect's job title
- `company` (optional): The prospect's company name
- `experience` (optional): Array of work experience objects
- `interests` (optional): Array of professional interests

#### callDetails
- `duration` (optional): Length of the call (defaults to "15 minutes")
- `topics` (optional): Array of topics discussed during the call
- `concerns` (optional): String describing prospect's main concerns
- `nextSteps` (optional): String describing agreed next steps
- `demoDate` (optional): Specific date/time for a scheduled demo

## Response Format

```json
{
  "status": "success",
  "data": {
    "followupContent": "Hi John,\n\nThank you for taking the time to speak with me today about VigilantEx's construction site surveillance solutions..."
  }
}
```

## Error Responses

```json
{
  "status": "error",
  "message": "Profile data is required"
}
```

```json
{
  "status": "error",
  "message": "Profile data must include at least name and title"
}
```

## Example Usage (JavaScript)

```javascript
// Using fetch API
const response = await fetch('http://localhost:5007/api/messages/warm-followup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profileData: {
      name: "Jane Doe",
      title: "Safety Director",
      company: "DEF Construction"
    },
    callDetails: {
      topics: ["safety features", "incident reduction statistics"],
      concerns: "implementation timeline and training requirements",
      nextSteps: "demo with safety team"
    }
  })
});

const data = await response.json();
console.log(data.data.followupContent);
```

## Example Usage (curl)

```bash
curl -X POST http://localhost:5007/api/messages/warm-followup \
  -H "Content-Type: application/json" \
  -d '{
    "profileData": {
      "name": "Robert Johnson",
      "title": "Operations Director",
      "company": "GHI Builders"
    },
    "callDetails": {
      "duration": "30 minutes",
      "topics": ["productivity improvements", "implementation timeline"],
      "concerns": "cost and ROI",
      "nextSteps": "follow-up call with CFO"
    }
  }'
```

## Notes

1. The API will use OpenAI's model if configured (via OPENAPI_KEY in .env), then fall back to local Transformers.js model, and finally use template-based generation if both AI methods fail.

2. For optimal results, provide as much profile data as possible, especially the prospect's job title and company, as these are used for personalization.

3. If specific call details aren't provided, the system will use reasonable defaults but the email will be less personalized.

4. The generated email includes several sections:
   - Personalized greeting
   - Thank you for the call
   - Summary of key points discussed
   - Responses to concerns raised
   - Confirmation of next steps
   - Professional closing