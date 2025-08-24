const { handler } = require("./index");
const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("receive-sms Lambda Function", () => {
    beforeEach(() => {
        ddbMock.reset();
        process.env.DYNAMODB_TABLE_NAME = "rsvp-table";
        process.env.AWS_REGION = "us-east-1";
    });

    const createSnsEvent = (message, phoneNumber = "+1234567890") => ({
        Records: [
            {
                Sns: {
                    Message: JSON.stringify({
                        originationNumber: phoneNumber,
                        messageBody: message,
                    }),
                },
            },
        ],
    });

    test('should save "Attending" status for "yes" message', async () => {
        const event = createSnsEvent("Yes, I will be there!");
        ddbMock.on(PutCommand).resolves({});

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toBe("RSVP received");
        expect(ddbMock.calls()).toHaveLength(1);
        expect(ddbMock.call(0).args[0].input).toEqual({
            TableName: "rsvp-table",
            Item: {
                phoneNumber: "+1234567890",
                rsvpStatus: "Attending",
                message: "Yes, I will be there!",
            },
        });
    });

    test('should save "Declined" status for "no" message', async () => {
        const event = createSnsEvent("Sorry, I cannot make it.");
        ddbMock.on(PutCommand).resolves({});

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toBe("RSVP received");
        expect(ddbMock.calls()).toHaveLength(1);
        expect(ddbMock.call(0).args[0].input).toEqual({
            TableName: "rsvp-table",
            Item: {
                phoneNumber: "+1234567890",
                rsvpStatus: "Declined",
                message: "Sorry, I cannot make it.",
            },
        });
    });

    test("should not save to DynamoDB for an unclear message", async () => {
        const event = createSnsEvent("What is the dress code?");

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toBe("RSVP status unclear");
        expect(ddbMock.calls()).toHaveLength(0);
    });

    test("should return 500 if DynamoDB put fails", async () => {
        const event = createSnsEvent("Yes");
        ddbMock.on(PutCommand).rejects(new Error("DynamoDB error"));

        const result = await handler(event);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).message).toBe("Error processing RSVP");
    });
});
