
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    const body = JSON.parse(event.body);
    const { message, phoneNumber } = body;

    if (!message || !phoneNumber) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing message or phoneNumber" }),
        };
    }

    const params = {
        Message: message,
        PhoneNumber: phoneNumber,
    };

    try {
        const command = new PublishCommand(params);
        await snsClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "SMS sent successfully" }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error sending SMS" }),
        };
    }
};
