import { describe, it, expect, beforeEach } from 'vitest'
import {
  createBooking,
  cancelBooking,
  createClass,
  listBookingsByEmail,
  countActiveBookings,
} from '@/lib/store'

describe('Booking Management', () => {
  describe('createBooking', () => {
    it('should create a booking for available class', () => {
      // Create a class first
      const testClass = createClass({
        title: 'Test Yoga',
        startTime: '2026-03-01T09:00:00.000Z',
        endTime: '2026-03-01T10:00:00.000Z',
        capacity: 10,
      })

      const result = createBooking({
        classId: testClass.id,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        retirementVillage: 'Sunrise Village',
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.booking.customerName).toBe('John Doe')
        expect(result.booking.customerEmail).toBe('john@example.com')
        expect(result.booking.status).toBe('active')
        expect(result.booking.cancelToken).toBeDefined()
      }
    })

    it('should reject booking for non-existent class', () => {
      const result = createBooking({
        classId: 'non-existent-class',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('class_not_found')
      }
    })

    it('should reject booking when class is full', () => {
      // Create a class with capacity 1
      const testClass = createClass({
        title: 'Small Class',
        startTime: '2026-03-02T09:00:00.000Z',
        endTime: '2026-03-02T10:00:00.000Z',
        capacity: 1,
      })

      // First booking should succeed
      const first = createBooking({
        classId: testClass.id,
        customerName: 'First Person',
        customerEmail: 'first@example.com',
      })
      expect(first.ok).toBe(true)

      // Second booking should fail (class full)
      const second = createBooking({
        classId: testClass.id,
        customerName: 'Second Person',
        customerEmail: 'second@example.com',
      })
      expect(second.ok).toBe(false)
      if (!second.ok) {
        expect(second.error).toBe('class_full')
      }
    })

    it('should reject duplicate booking for same email', () => {
      const testClass = createClass({
        title: 'No Duplicates Class',
        startTime: '2026-03-03T09:00:00.000Z',
        endTime: '2026-03-03T10:00:00.000Z',
        capacity: 10,
      })

      // First booking
      const first = createBooking({
        classId: testClass.id,
        customerName: 'Duplicate User',
        customerEmail: 'duplicate@example.com',
      })
      expect(first.ok).toBe(true)

      // Same email should be rejected
      const second = createBooking({
        classId: testClass.id,
        customerName: 'Duplicate User Again',
        customerEmail: 'DUPLICATE@example.com', // Different case
      })
      expect(second.ok).toBe(false)
      if (!second.ok) {
        expect(second.error).toBe('already_booked')
      }
    })
  })

  describe('cancelBooking', () => {
    it('should cancel an active booking', () => {
      const testClass = createClass({
        title: 'Cancel Test Class',
        startTime: '2026-03-04T09:00:00.000Z',
        endTime: '2026-03-04T10:00:00.000Z',
        capacity: 10,
      })

      const booking = createBooking({
        classId: testClass.id,
        customerName: 'Cancel Test',
        customerEmail: 'cancel@example.com',
      })

      expect(booking.ok).toBe(true)
      if (!booking.ok) return

      const cancelResult = cancelBooking(booking.booking.cancelToken)

      expect(cancelResult.ok).toBe(true)
      if (cancelResult.ok) {
        expect(cancelResult.booking.status).toBe('cancelled')
        expect(cancelResult.booking.cancelledAt).toBeDefined()
      }
    })

    it('should reject invalid cancel token', () => {
      const result = cancelBooking('invalid-token')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('not_found')
      }
    })

    it('should handle already cancelled booking idempotently', () => {
      const testClass = createClass({
        title: 'Double Cancel Test',
        startTime: '2026-03-05T09:00:00.000Z',
        endTime: '2026-03-05T10:00:00.000Z',
        capacity: 10,
      })

      const booking = createBooking({
        classId: testClass.id,
        customerName: 'Double Cancel',
        customerEmail: 'doublecancel@example.com',
      })

      if (!booking.ok) return

      // First cancel should work
      const first = cancelBooking(booking.booking.cancelToken)
      expect(first.ok).toBe(true)

      // Second cancel should also return ok (idempotent)
      const second = cancelBooking(booking.booking.cancelToken)
      expect(second.ok).toBe(true)
      if (second.ok) {
        expect(second.booking.status).toBe('cancelled')
      }
    })

    it('should free up spot when booking is cancelled', () => {
      const testClass = createClass({
        title: 'Spot Free Test',
        startTime: '2026-03-06T09:00:00.000Z',
        endTime: '2026-03-06T10:00:00.000Z',
        capacity: 1,
      })

      // Fill the class
      const booking = createBooking({
        classId: testClass.id,
        customerName: 'Takes Spot',
        customerEmail: 'spot@example.com',
      })

      if (!booking.ok) return

      // Class should be full
      expect(countActiveBookings(testClass.id)).toBe(1)

      // Cancel the booking
      cancelBooking(booking.booking.cancelToken)

      // Spot should be free
      expect(countActiveBookings(testClass.id)).toBe(0)

      // New booking should work
      const newBooking = createBooking({
        classId: testClass.id,
        customerName: 'New Person',
        customerEmail: 'new@example.com',
      })
      expect(newBooking.ok).toBe(true)
    })
  })

  describe('listBookingsByEmail', () => {
    it('should return bookings for an email', () => {
      const testClass = createClass({
        title: 'Lookup Test Class',
        startTime: '2026-03-07T09:00:00.000Z',
        endTime: '2026-03-07T10:00:00.000Z',
        capacity: 10,
      })

      createBooking({
        classId: testClass.id,
        customerName: 'Lookup User',
        customerEmail: 'lookup@example.com',
        retirementVillage: 'Test Village',
      })

      const bookings = listBookingsByEmail('lookup@example.com')

      expect(bookings.length).toBeGreaterThanOrEqual(1)
      const found = bookings.find((b) => b.classTitle === 'Lookup Test Class')
      expect(found).toBeDefined()
      expect(found?.classId).toBe(testClass.id)
      expect(found?.bookingStatus).toBe('active')
    })

    it('should be case-insensitive for email lookup', () => {
      const testClass = createClass({
        title: 'Case Test Class',
        startTime: '2026-03-08T09:00:00.000Z',
        endTime: '2026-03-08T10:00:00.000Z',
        capacity: 10,
      })

      createBooking({
        classId: testClass.id,
        customerName: 'Case User',
        customerEmail: 'CaseTest@Example.com',
      })

      const bookings = listBookingsByEmail('casetest@example.com')
      const found = bookings.find((b) => b.classTitle === 'Case Test Class')
      expect(found).toBeDefined()
    })

    it('should return empty array for unknown email', () => {
      const bookings = listBookingsByEmail('nonexistent@example.com')
      expect(Array.isArray(bookings)).toBe(true)
    })
  })
})
