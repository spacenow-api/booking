import uuid from 'uuid';

import * as dynamoDbLib from '../libs/dynamodb-lib';
import { success, failure } from '../libs/response-lib';

const BOOKINGS_PRE_RESERVATION_TABLE = process.env.preReservationTableName;

const EXPIRATION_TIME = 60 * 1000; // 1 minute

export const createPreReservation = async bookingId => {
  if (bookingId) {
    const expirationTime = Math.floor((Date.now() + EXPIRATION_TIME) / 1000);
    try {
      await dynamoDbLib.call('put', {
        TableName: BOOKINGS_PRE_RESERVATION_TABLE,
        Item: {
          id: uuid.v1(),
          bookingId: bookingId,
          ttl: expirationTime
        }
      });
    } catch (err) {
      throw err;
    }
  } else {
    throw new Error(
      "It's not possible create a reservation without a 'bookingId'."
    );
  }
};

function onCheckExpirationTime(items) {
  const now = Math.floor(Date.now() / 1000);
  return items.map(o => {
    o.isExpired = now > o.ttl;
    return o;
  });
}

export const fetchAllPreReservations = async () => {
  try {
    const result = await dynamoDbLib.call('scan', {
      TableName: BOOKINGS_PRE_RESERVATION_TABLE
    });
    const preReservations = onCheckExpirationTime(result.Items);
    return success(preReservations);
  } catch (e) {
    console.error(e);
    return failure({ status: false, error: e });
  }
};

export const getPreReservationsByBookingId = async event => {
  try {
    const result = await dynamoDbLib.call('scan', {
      TableName: BOOKINGS_PRE_RESERVATION_TABLE,
      FilterExpression: 'bookingId = :bookingId',
      ExpressionAttributeValues: { ':bookingId': event.pathParameters.id }
    });
    const preReservations = onCheckExpirationTime(result.Items);
    return success(preReservations);
  } catch (e) {
    console.error(e);
    return failure({ status: false, error: e });
  }
};
