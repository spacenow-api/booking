import { success, failure } from '../libs/response-lib'
import { resolveBooking } from './../validations'
import { Bookings } from './../models'

export const main = async (event) => {
  try {
    const data = JSON.parse(event.body)
    await Bookings.update(
      { sourceId: data.sourceId, chargeId: data.chargeId, updatedAt: Date.now() },
      { where: { bookingId: event.pathParameters.id } }
    )
    const bookingObjUpdated = await Bookings.findOne({ where: { bookingId: event.pathParameters.id }, raw: true })
    return success({ status: 'updated', data: resolveBooking(bookingObjUpdated) })
  } catch (err) {
    console.error(err)
    return failure({ status: 'error', error: err })
  }
}
