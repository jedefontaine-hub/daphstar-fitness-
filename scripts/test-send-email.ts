import { sendBookingConfirmation } from '../lib/email';

async function testSendBookingConfirmation() {
  const result = await sendBookingConfirmation({
    customerEmail: 'your-email@example.com',
    customerName: 'Test User',
    classTitle: 'Yoga Basics',
    classStartTime: new Date().toISOString(),
    classEndTime: new Date(Date.now() + 3600000).toISOString(),
    cancelToken: 'test-cancel-token',
  });
  console.log('Booking confirmation result:', result);
}

testSendBookingConfirmation();
