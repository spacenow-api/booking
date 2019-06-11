import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event, context) {
  const params = {
    TableName: process.env.tableName,
    Key: {
      bookingId: event.pathParameters.id
    },
    ExpressionAttributeNames: {
      "#booking_state": "bookingState"
    },
    ExpressionAttributeValues: {
      ":bookingState": "declined",
      ":updatedAt": Date.now() || null
    },
    UpdateExpression:
      "SET #booking_state = :bookingState, updatedAt = :updatedAt",
    ReturnValues: "ALL_NEW"
  };
  try {
    const { Attributes } = await dynamoDbLib.call("update", params);
    return success({ status: true, data: Attributes });
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
}
