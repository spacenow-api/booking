import { resolveBooking } from './../validations'
import { Bookings } from './../models'

export default async (bookingId, state) => {
  try {
    await Bookings.update({ bookingState: state, updatedAt: Date.now() }, { where: { bookingId } })
    const bookingObj = await Bookings.findOne({ where: { bookingId }, raw: true })
    return resolveBooking(bookingObj)
  } catch (err) {
    throw err
  }
}
