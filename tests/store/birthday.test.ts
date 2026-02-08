import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  registerCustomer,
  getCustomersWithBirthdayToday,
  updateCustomerProfile,
} from '@/lib/store'

describe('Birthday Functions', () => {
  describe('getCustomersWithBirthdayToday', () => {
    it('should find customers with birthday today', () => {
      const today = new Date()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const birthdate = `1950-${month}-${day}`

      const email = `birthday${Date.now()}@example.com`
      const register = registerCustomer({
        name: 'Birthday Person',
        email,
        password: 'password123',
      })

      if (!register.ok) return

      // Update their birthdate to today
      updateCustomerProfile(register.customer.id, {
        birthdate,
      })

      const birthdayCustomers = getCustomersWithBirthdayToday()
      const found = birthdayCustomers.find((c) => c.email.toLowerCase() === email.toLowerCase())

      expect(found).toBeDefined()
      expect(found?.name).toBe('Birthday Person')
    })

    it('should not include customers without birthdate', () => {
      const email = `nobirthday${Date.now()}@example.com`
      registerCustomer({
        name: 'No Birthday Set',
        email,
        password: 'password123',
      })

      const birthdayCustomers = getCustomersWithBirthdayToday()
      const found = birthdayCustomers.find((c) => c.email.toLowerCase() === email.toLowerCase())

      expect(found).toBeUndefined()
    })

    it('should not include customers with different birthday', () => {
      // Set birthday to a date that's definitely not today
      const today = new Date()
      const differentDay = today.getDate() === 15 ? 16 : 15
      const differentMonth = today.getMonth() === 5 ? '07' : '06'
      const birthdate = `1945-${differentMonth}-${String(differentDay).padStart(2, '0')}`

      const email = `differentday${Date.now()}@example.com`
      const register = registerCustomer({
        name: 'Different Day',
        email,
        password: 'password123',
      })

      if (!register.ok) return

      updateCustomerProfile(register.customer.id, {
        birthdate,
      })

      const birthdayCustomers = getCustomersWithBirthdayToday()
      const found = birthdayCustomers.find((c) => c.email.toLowerCase() === email.toLowerCase())

      expect(found).toBeUndefined()
    })

    it('should match birthday regardless of year', () => {
      const today = new Date()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')

      const email1 = `oldperson${Date.now()}@example.com`
      const email2 = `youngperson${Date.now()}@example.com`

      const reg1 = registerCustomer({
        name: 'Old Person',
        email: email1,
        password: 'password123',
      })

      const reg2 = registerCustomer({
        name: 'Young Person',
        email: email2,
        password: 'password123',
      })

      if (!reg1.ok || !reg2.ok) return

      // Different years, same month/day
      updateCustomerProfile(reg1.customer.id, { birthdate: `1940-${month}-${day}` })
      updateCustomerProfile(reg2.customer.id, { birthdate: `1960-${month}-${day}` })

      const birthdayCustomers = getCustomersWithBirthdayToday()

      const found1 = birthdayCustomers.find((c) => c.email.toLowerCase() === email1.toLowerCase())
      const found2 = birthdayCustomers.find((c) => c.email.toLowerCase() === email2.toLowerCase())

      expect(found1).toBeDefined()
      expect(found2).toBeDefined()
    })
  })
})
