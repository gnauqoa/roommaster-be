// Helper method to calculate and log early check-in fees
// This method is called during check-in to determine if additional fees should be charged
// based on the configured check-in time and grace period
//
// TODO: Integrate with TransactionService to create actual fee transactions
// For now, this calculates and logs the fees that would be charged
//
// Example usage in checkIn method:
//
// const now = dayjs();
// const feeCalculations = await Promise.all(
// bookingRooms.map(async (br) => {
// const fee = await this.appSettingService.calculateEarlyCheckInFee(
// now.toDate(),
// Number(br.pricePerNight)
// );
// return { bookingRoomId: br.id, fee, roomNumber: br.room.roomNumber };
// })
// );
//
// const roomsWithFees = feeCalculations.filter((calc) => calc.fee > 0);
// if (roomsWithFees.length > 0) {
// console.log(
// `Early check-in fees applied:`,
// roomsWithFees.map((r) => `Room ${r.roomNumber}: ${r.fee} VND`)
// );
// // TODO: Create transaction records for early check-in fees
// }

// Helper method to calculate and log late check-out fees
// This method is called during check-out to determine if additional fees should be charged
// based on the configured check-out time and grace period
//
// TODO: Integrate with TransactionService to create actual fee transactions
// For now, this calculates and logs the fees that would be charged
//
// Example usage in checkOut method:
//
// const now = dayjs();
// const feeCalculations = await Promise.all(
// bookingRooms.map(async (br) => {
// const fee = await this.appSettingService.calculateLateCheckOutFee(
// now.toDate(),
// Number(br.pricePerNight)
// );
// return { bookingRoomId: br.id, fee, roomNumber: br.room.roomNumber };
// })
// );
//
// const roomsWithFees = feeCalculations.filter((calc) => calc.fee > 0);
// if (roomsWithFees.length > 0) {
// console.log(
// `Late check-out fees applied:`,
// roomsWithFees.map((r) => `Room ${r.roomNumber}: ${r.fee} VND`)
// );
// // TODO: Create transaction records for late check-out fees
// }
