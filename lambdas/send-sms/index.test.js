const { handler } = require('./index');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { mockClient } = require('aws-sdk-client-mock');

const snsMock = mockClient(SNSClient);

describe('send-sms Lambda Function', () => {
    beforeEach(() => {
        snsMock.reset();
        process.env.AWS_REGION = 'us-east-1';
    });

    afterEach(() => {
        delete process.env.AWS_REGION;
    });

    test('should send SMS successfully with valid input', async () => {
        // Mock successful SNS response
        snsMock.on(PublishCommand).resolves({
            MessageId: 'test-message-id'
        });

        const event = {
            body: JSON.stringify({
                message: 'Test wedding reminder',
                phoneNumber: '+1234567890'
            })
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            message: 'SMS sent successfully'
        });

        // Verify SNS was called with correct parameters
        expect(snsMock.calls()).toHaveLength(1);
        const call = snsMock.calls()[0];
        expect(call.args[0].input).toEqual({
            Message: 'Test wedding reminder',
            PhoneNumber: '+1234567890'
        });
    });

    test('should return 400 when message is missing', async () => {
        const event = {
            body: JSON.stringify({
                phoneNumber: '+1234567890'
            })
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
            message: 'Missing message or phoneNumber'
        });

        // Verify SNS was not called
        expect(snsMock.calls()).toHaveLength(0);
    });

    test('should return 400 when phoneNumber is missing', async () => {
        const event = {
            body: JSON.stringify({
                message: 'Test message'
            })
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
            message: 'Missing message or phoneNumber'
        });

        // Verify SNS was not called
        expect(snsMock.calls()).toHaveLength(0);
    });

    test('should return 500 when SNS throws an error', async () => {
        // Mock SNS error
        snsMock.on(PublishCommand).rejects(new Error('SNS service error'));

        const event = {
            body: JSON.stringify({
                message: 'Test message',
                phoneNumber: '+1234567890'
            })
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toEqual({
            message: 'Error sending SMS'
        });
    });

    test('should handle malformed JSON in request body', async () => {
        const event = {
            body: 'invalid json'
        };

        await expect(handler(event)).rejects.toThrow();
    });

    test('should handle empty request body', async () => {
        const event = {
            body: JSON.stringify({})
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
            message: 'Missing message or phoneNumber'
        });
    });
});
