
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const getRsvpStatus = (message) => {
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes("yes") || lowerCaseMessage.includes("attending")) {
        return "Attending";
    }
    if (lowerCaseMessage.includes("no") || lowerCaseMessage.includes("cannot")) {
        return "Declined";
    }
    return "Waiting";
};

exports.handler = async (event) => {
    const snsMessage = JSON.parse(event.Records[0].Sns.Message);
    const phoneNumber = snsMessage.originationNumber;
    const message = snsMessage.messageBody;

    console.log(`Received message from ${phoneNumber}: ${message}`);

    const rsvpStatus = getRsvpStatus(message);

    if (rsvpStatus === "Waiting") {
        console.log("Could not determine RSVP status from message.");
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "RSVP status unclear" }),
        };
    }

    const command = new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: {
            phoneNumber: phoneNumber,
            rsvpStatus: rsvpStatus,
            message: message,
        },
    });

    try {
        await docClient.send(command);
        console.log(`Successfully saved RSVP status for ${phoneNumber}: ${rsvpStatus}`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "RSVP received" }),
        };
    } catch (error) {
        console.error("Error saving to DynamoDB:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error processing RSVP" }),
        };
    }
};
