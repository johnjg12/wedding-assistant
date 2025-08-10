const { handler } = require('./index');

describe('receive-sms Lambda Function', () => {
    let consoleSpy;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    test('should process SNS message successfully', async () => {
        const testMessage = 'Yes, I will be attending the wedding!';
        const event = {
            Records: [{
                Sns: {
                    Message: testMessage
                }
            }]
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            message: 'Message received'
        });

        // Verify message was logged
        expect(consoleSpy).toHaveBeenCalledWith('Received message:', testMessage);
    });

    test('should handle RSVP confirmation message', async () => {
        const rsvpMessage = 'YES - John and Jane will attend';
        const event = {
            Records: [{
                Sns: {
                    Message: rsvpMessage
                }
            }]
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(consoleSpy).toHaveBeenCalledWith('Received message:', rsvpMessage);
    });

    test('should handle RSVP decline message', async () => {
        const declineMessage = 'Sorry, we cannot make it to the wedding';
        const event = {
            Records: [{
                Sns: {
                    Message: declineMessage
                }
            }]
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(consoleSpy).toHaveBeenCalledWith('Received message:', declineMessage);
    });

    test('should handle question from guest', async () => {
        const questionMessage = 'What time does the ceremony start?';
        const event = {
            Records: [{
                Sns: {
                    Message: questionMessage
                }
            }]
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(consoleSpy).toHaveBeenCalledWith('Received message:', questionMessage);
    });

    test('should handle empty message', async () => {
        const event = {
            Records: [{
                Sns: {
                    Message: ''
                }
            }]
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(consoleSpy).toHaveBeenCalledWith('Received message:', '');
    });

    test('should handle message with special characters', async () => {
        const specialMessage = 'Can\'t wait! 🎉💒 See you at 3:30 PM';
        const event = {
            Records: [{
                Sns: {
                    Message: specialMessage
                }
            }]
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(consoleSpy).toHaveBeenCalledWith('Received message:', specialMessage);
    });

    test('should handle malformed event structure', async () => {
        const event = {
            Records: [{}]
        };

        await expect(handler(event)).rejects.toThrow();
    });

    test('should handle missing Records array', async () => {
        const event = {};

        await expect(handler(event)).rejects.toThrow();
    });
});
