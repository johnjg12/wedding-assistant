
exports.handler = async (event) => {
    const snsMessage = event.Records[0].Sns.Message;
    console.log("Received message:", snsMessage);

    // TODO: Add logic to process the reply

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Message received" }),
    };
};
