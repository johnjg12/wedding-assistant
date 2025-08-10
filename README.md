# Wedding Assistant SMS Lambda Functions

A serverless SMS messaging system for wedding coordination, built with AWS Lambda functions and deployed using Terraform.

## Overview

This project provides two Lambda functions to handle SMS messaging for wedding-related communications:

- **send-sms**: Sends SMS messages to wedding guests or vendors
- **receive-sms**: Processes incoming SMS replies (currently logs messages, ready for custom logic)

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  send-sms    │───▶│   AWS SNS       │
│                 │    │   Lambda     │    │                 │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                     │
                                                     ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│  receive-sms    │◀───│   AWS SNS    │◀───│  Phone Number   │
│    Lambda       │    │   Topic      │    │   (Replies)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

## Features

- **Outbound SMS**: Send messages to wedding guests with event updates, reminders, or notifications
- **Inbound SMS Processing**: Receive and process replies from guests (RSVP confirmations, questions, etc.)
- **Serverless Architecture**: Cost-effective, auto-scaling Lambda functions
- **Infrastructure as Code**: Terraform deployment for consistent environments

## Project Structure

```
wedding-assistant/
├── lambdas/                    # Lambda function source code
│   ├── send-sms/
│   │   └── index.js           # Outbound SMS handler
│   ├── receive-sms/
│   │   └── index.js           # Inbound SMS processor
│   ├── package.json           # Node.js dependencies
│   └── package-lock.json
├── terraform/                  # Infrastructure as Code
│   ├── main.tf               # AWS resources definition
│   ├── variables.tf          # Configuration variables
│   └── outputs.tf            # Resource outputs
└── README.md                 # This file
```

## Lambda Functions

### send-sms

Handles outbound SMS messages via AWS SNS.

**Trigger**: API Gateway HTTP POST request
**Input**: JSON payload with `message` and `phoneNumber`
**Output**: Success/error response

**Example Request**:
```json
{
  "message": "Don't forget about the rehearsal dinner tomorrow at 7 PM!",
  "phoneNumber": "+1234567890"
}
```

### receive-sms

Processes incoming SMS messages received via SNS.

**Trigger**: SNS message (from phone number replies)
**Input**: SNS event containing the SMS message
**Output**: Processing confirmation

**Current Status**: Logs incoming messages. Ready for custom processing logic (RSVP handling, guest questions, etc.)

## Dependencies

- **Runtime**: Node.js 18.x
- **AWS SDK**: `@aws-sdk/client-sns` v3.598.0
- **Testing**: Jest v30.0.5
- **Mocking**: `aws-sdk-client-mock` v4.1.0

## Environment Variables

- `AWS_REGION`: AWS region for SNS operations (set automatically by Lambda runtime)

## Getting Started

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform installed
- Node.js 18+ for local development

### Deployment

1. **Install dependencies**:
   ```bash
   cd lambdas
   npm install
   ```

2. **Deploy infrastructure**:
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

3. **Package and deploy Lambda functions**:
   The Terraform configuration handles Lambda deployment automatically.

### Testing

Run the test suite:
```bash
cd lambdas
npm test
```

## Usage Examples

### Sending a Wedding Reminder
```bash
curl -X POST https://your-api-gateway-url/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Wedding ceremony starts in 2 hours! See you at the venue.",
    "phoneNumber": "+1234567890"
  }'
```

### Processing Guest Replies
The `receive-sms` function automatically processes incoming messages. Current implementation logs all messages for review.

## Development

### Adding Custom Reply Processing

To add custom logic for processing guest replies, modify `/lambdas/receive-sms/index.js`:

```javascript
// Example: RSVP processing
const message = snsMessage.toLowerCase();
if (message.includes('yes') || message.includes('attending')) {
    // Handle RSVP confirmation
} else if (message.includes('no') || message.includes('cannot')) {
    // Handle RSVP decline
}
```

### Local Testing

Use the included Jest tests to validate functionality:
```bash
npm test -- --watch
```

## Security Considerations

- Lambda functions run with minimal IAM permissions
- SNS topics are configured for the specific phone number
- No sensitive data is logged or stored in plain text

## Cost Optimization

- Lambda functions use ARM64 architecture for better price/performance
- Functions are configured with appropriate memory and timeout settings
- SNS charges apply per message sent/received

## Troubleshooting

### Common Issues

1. **SMS not sending**: Check SNS permissions and phone number format
2. **Replies not received**: Verify SNS topic subscription and Lambda trigger
3. **Deployment failures**: Ensure AWS credentials and Terraform state

### Logs

View Lambda logs in CloudWatch:
```bash
aws logs tail /aws/lambda/send-sms --follow
aws logs tail /aws/lambda/receive-sms --follow
```

## Contributing

1. Add tests for new functionality
2. Update documentation for any API changes
3. Follow existing code style and patterns

## License

ISC License