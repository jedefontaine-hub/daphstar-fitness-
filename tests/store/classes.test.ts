import { describe, it, expect, beforeEach } from 'vitest'
import {
  createClass,
  createRecurringClasses,
  getClassById,
  listClasses,
  updateClass,
  cancelClass,
  countActiveBookings,
  type ClassInput,
} from '@/lib/store'

describe('Class Management', () => {
  describe('createClass', () => {
    it('should create a new class with correct properties', () => {
      const input: ClassInput = {
        title: 'Yoga Basics',
        startTime: '2026-02-15T09:00:00.000Z',
        endTime: '2026-02-15T10:00:00.000Z',
        capacity: 15,
        location: 'Sunrise Village',
      }

      const result = createClass(input)

      expect(result).toMatchObject({
        title: 'Yoga Basics',
        startTime: '2026-02-15T09:00:00.000Z',
        endTime: '2026-02-15T10:00:00.000Z',
        capacity: 15,
        location: 'Sunrise Village',
        status: 'scheduled',
      })
      expect(result.id).toBeDefined()
    })

    it('should create class without location', () => {
      const input: ClassInput = {
        title: 'Cardio Class',
        startTime: '2026-02-16T10:00:00.000Z',
        endTime: '2026-02-16T11:00:00.000Z',
        capacity: 20,
      }

      const result = createClass(input)

      expect(result.title).toBe('Cardio Class')
      expect(result.location).toBeUndefined()
    })
  })

  describe('createRecurringClasses', () => {
    it('should create multiple classes for recurring weeks', () => {
      const input = {
        title: 'Weekly Pilates',
        startTime: '2026-02-15T14:00:00.000Z',
        endTime: '2026-02-15T15:00:00.000Z',
        capacity: 12,
        location: 'Oakwood Gardens',
        repeatWeeks: 4,
      }

      const result = createRecurringClasses(input)

      expect(result).toHaveLength(4)
      
      // Check first class
      expect(result[0].title).toBe('Weekly Pilates')
      expect(result[0].startTime).toBe('2026-02-15T14:00:00.000Z')
      
      // Check second class is one week later
      const firstDate = new Date(result[0].startTime)
      const secondDate = new Date(result[1].startTime)
      const diffDays = (secondDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBe(7)
      
      // All should have same title, capacity, location
      result.forEach((cls) => {
        expect(cls.title).toBe('Weekly Pilates')
        expect(cls.capacity).toBe(12)
        expect(cls.location).toBe('Oakwood Gardens')
        expect(cls.status).toBe('scheduled')
      })
    })

    it('should maintain correct duration across recurring classes', () => {
      const input = {
        title: 'Stretching',
        startTime: '2026-02-20T08:00:00.000Z',
        endTime: '2026-02-20T08:45:00.000Z', // 45 minute class
        capacity: 10,
        repeatWeeks: 3,
      }

      const result = createRecurringClasses(input)

      result.forEach((cls) => {
        const start = new Date(cls.startTime)
        const end = new Date(cls.endTime)
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
        expect(durationMinutes).toBe(45)
      })
    })
  })

  describe('getClassById', () => {
    it('should return class when found', () => {
      const created = createClass({
        title: 'Test Class',
        startTime: '2026-02-17T10:00:00.000Z',
        endTime: '2026-02-17T11:00:00.000Z',
        capacity: 10,
      })

      const found = getClassById(created.id)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(created.id)
      expect(found?.title).toBe('Test Class')
    })

    it('should return null for non-existent class', () => {
      const result = getClassById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('updateClass', () => {
    it('should update class properties', () => {
      const created = createClass({
        title: 'Original Title',
        startTime: '2026-02-18T09:00:00.000Z',
        endTime: '2026-02-18T10:00:00.000Z',
        capacity: 10,
      })

      const updated = updateClass(created.id, {
        title: 'Updated Title',
        capacity: 15,
      })

      expect(updated).not.toBeNull()
      expect(updated?.title).toBe('Updated Title')
      expect(updated?.capacity).toBe(15)
      // Original time should remain
      expect(updated?.startTime).toBe('2026-02-18T09:00:00.000Z')
    })

    it('should return null for non-existent class', () => {
      const result = updateClass('non-existent-id', { title: 'New Title' })
      expect(result).toBeNull()
    })
  })

  describe('cancelClass', () => {
    it('should mark class as cancelled', () => {
      const created = createClass({
        title: 'To Cancel',
        startTime: '2026-02-19T09:00:00.000Z',
        endTime: '2026-02-19T10:00:00.000Z',
        capacity: 10,
      })

      const cancelled = cancelClass(created.id)

      expect(cancelled).not.toBeNull()
      expect(cancelled?.status).toBe('cancelled')
    })

    it('should return null for non-existent class', () => {
      const result = cancelClass('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('countActiveBookings', () => {
    it('should return 0 for class with no bookings', () => {
      const created = createClass({
        title: 'Empty Class',
        startTime: '2026-02-20T09:00:00.000Z',
        endTime: '2026-02-20T10:00:00.000Z',
        capacity: 10,
      })

      const count = countActiveBookings(created.id)
      expect(count).toBe(0)
    })
  })
})
