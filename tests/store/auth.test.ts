import { describe, it, expect } from 'vitest'
import {
  registerCustomer,
  loginCustomer,
  getCustomerById,
  updateCustomerProfile,
} from '@/lib/store'

describe('Customer Authentication', () => {
  describe('registerCustomer', () => {
    it('should register a new customer', () => {
      const result = registerCustomer({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        retirementVillage: 'Sunrise Village',
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.customer.name).toBe('Test User')
        expect(result.customer.retirementVillage).toBe('Sunrise Village')
        expect(result.customer.id).toBeDefined()
        // Password should not be in the returned customer object
        expect((result.customer as { password?: string }).password).toBeUndefined()
      }
    })

    it('should reject duplicate email', () => {
      const email = `duplicate${Date.now()}@example.com`

      // Register first time
      const first = registerCustomer({
        name: 'First User',
        email,
        password: 'password123',
      })
      expect(first.ok).toBe(true)

      // Try to register again with same email
      const second = registerCustomer({
        name: 'Second User',
        email,
        password: 'password456',
      })
      expect(second.ok).toBe(false)
      if (!second.ok) {
        expect(second.error).toBe('email_exists')
      }
    })

    it('should be case-insensitive for email duplicates', () => {
      const email = `casedup${Date.now()}@example.com`

      registerCustomer({
        name: 'First',
        email: email.toLowerCase(),
        password: 'password123',
      })

      const result = registerCustomer({
        name: 'Second',
        email: email.toUpperCase(),
        password: 'password456',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('email_exists')
      }
    })
  })

  describe('loginCustomer', () => {
    it('should login with correct credentials', () => {
      const email = `login${Date.now()}@example.com`
      const password = 'correctpassword'

      registerCustomer({
        name: 'Login Test',
        email,
        password,
      })

      const result = loginCustomer(email, password)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.customer.name).toBe('Login Test')
        expect(result.customer.email.toLowerCase()).toBe(email.toLowerCase())
      }
    })

    it('should reject wrong password', () => {
      const email = `wrongpw${Date.now()}@example.com`

      registerCustomer({
        name: 'Wrong PW Test',
        email,
        password: 'correctpassword',
      })

      const result = loginCustomer(email, 'wrongpassword')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('invalid_credentials')
      }
    })

    it('should reject non-existent email', () => {
      const result = loginCustomer('nonexistent@example.com', 'anypassword')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('invalid_credentials')
      }
    })

    it('should be case-insensitive for email', () => {
      const email = `caselogin${Date.now()}@example.com`

      registerCustomer({
        name: 'Case Login',
        email: email.toLowerCase(),
        password: 'password123',
      })

      const result = loginCustomer(email.toUpperCase(), 'password123')
      expect(result.ok).toBe(true)
    })
  })

  describe('getCustomerById', () => {
    it('should return customer data', () => {
      const email = `getbyid${Date.now()}@example.com`

      const register = registerCustomer({
        name: 'Get By ID',
        email,
        password: 'password123',
        retirementVillage: 'Oakwood Gardens',
      })

      if (!register.ok) return

      const customer = getCustomerById(register.customer.id)

      expect(customer).not.toBeNull()
      expect(customer?.name).toBe('Get By ID')
      expect(customer?.email.toLowerCase()).toBe(email.toLowerCase())
      expect(customer?.retirementVillage).toBe('Oakwood Gardens')
    })

    it('should return null for non-existent customer', () => {
      const result = getCustomerById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('updateCustomerProfile', () => {
    it('should update profile fields', () => {
      const email = `update${Date.now()}@example.com`

      const register = registerCustomer({
        name: 'Original Name',
        email,
        password: 'password123',
      })

      if (!register.ok) return

      const result = updateCustomerProfile(register.customer.id, {
        name: 'Updated Name',
        phone: '0412345678',
        birthdate: '1950-05-15',
        emergencyContactName: 'John Smith',
        emergencyContactPhone: '0498765432',
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.customer.name).toBe('Updated Name')
        expect(result.customer.phone).toBe('0412345678')
        expect(result.customer.birthdate).toBe('1950-05-15')
        expect(result.customer.emergencyContactName).toBe('John Smith')
        expect(result.customer.emergencyContactPhone).toBe('0498765432')
      }
    })

    it('should reject email change to existing email', () => {
      const email1 = `profileemail1_${Date.now()}@example.com`
      const email2 = `profileemail2_${Date.now()}@example.com`

      registerCustomer({
        name: 'User One',
        email: email1,
        password: 'password123',
      })

      const user2 = registerCustomer({
        name: 'User Two',
        email: email2,
        password: 'password123',
      })

      if (!user2.ok) return

      // Try to change user2's email to user1's email
      const result = updateCustomerProfile(user2.customer.id, {
        email: email1,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('email_exists')
      }
    })

    it('should return error for non-existent customer', () => {
      const result = updateCustomerProfile('non-existent-id', {
        name: 'New Name',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('not_found')
      }
    })
  })
})
