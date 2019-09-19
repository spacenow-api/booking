import AWS from 'aws-sdk'

import * as dynamoDbLib from '../libs/dynamodb-lib'
import { success, failure } from '../libs/response-lib'
import updateBookingState from './updateBookingState'
import { BookingStates } from './../validations'
import { CONNREFUSED } from 'dns'

const BOOKINGS_TABLE = process.env.tableName

const lambda = new AWS.Lambda()

// Clean availabilities for timed out bookings FOR A LISTING
export const main = async (event, context) => {
  if (event.pathParameters.id) {
    let expirationTime = Date.now() - 1800000 // 30 minutes (ms) expire
    const params = {
      TableName: BOOKINGS_TABLE,
      FilterExpression:
        'listingId = :listingId AND bookingState = :bookingState AND createdAt < :expirationTime',
      ExpressionAttributeValues: {
        ':listingId': parseInt(event.pathParameters.id),
        ':bookingState': BookingStates.PENDING,
        ':expirationTime': expirationTime
      }
    }

    try {
      const response = await dynamoDbLib.call('scan', params)
      const bookings = response.Items
      for (const item of bookings) {
        onCleanAvailabilities(item.bookingId)
        await updateBookingState(item.bookingId, BookingStates.TIMEOUT)
      }
      return success({ status: true, count: bookings.length })
    } catch (err) {
      return failure({
        status: false,
        error: err
      })
    }
  } else {
    return failure({
      status: false,
      error: `It's not possible check availabilities without a valid 'listingId'.`
    })
  }
}

const onCleanAvailabilities = (bookingId) => {
  const environment = process.env.environment
  lambda.invoke(
    {
      FunctionName: `spacenow-availabilities-api-${environment}-deleteByBooking`,
      Payload: JSON.stringify({ pathParameters: { id: bookingId } })
    },
    (error) => {
      if (error) {
        console.error(error)
      } else {
        console.info(`Availabilities removed with success to booking ${bookingId}`)
      }
    }
  )
}
