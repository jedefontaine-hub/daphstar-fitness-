# Mobile QA Checklist

Use this checklist before demos or handoff.

## Preconditions

- Backend running at `http://<your-lan-ip>:3000`
- Expo app running from `mobile/`
- Phone and dev machine are on the same Wi-Fi

## Startup

1. Open app in Expo Go.
2. Confirm sign-in screen appears (or auto sign-in if profile exists).
3. Tap `Check connection` and confirm status says connected.

## Sign-In And Profile

1. Sign in with name and email.
2. Confirm tabs appear: `Classes`, `My Bookings`.
3. Tap `Sign out` and confirm app returns to sign-in screen.
4. Tap `Clear profile`, close app, reopen, confirm no auto sign-in.

## Classes Tab

1. Verify filter pills are visible: `Upcoming`, `All`, `Cancelled`.
2. Verify summary line changes when switching filters.
3. Pull down to refresh and confirm spinner appears.

## Booking Flow

1. In `Classes`, choose a bookable class and tap `Book`.
2. Confirm success alert appears.
3. Confirm `Spots left` decreases.
4. Confirm `My Bookings` badge increments.

## My Bookings Tab

1. Open `My Bookings` and confirm active booking is listed.
2. Pull down to refresh and confirm list updates.
3. Tap `Cancel booking` and confirm confirmation popup appears.
4. Confirm cancelled booking disappears from list.
5. Confirm `My Bookings` badge decrements.

## Data And Consistency

1. Return to `Classes` and verify `Spots left` increases after cancellation.
2. Ensure plain `Fitness` classes are not shown.
3. Ensure non-bookable classes have disabled `Book` button.

## Error Handling

1. Stop backend server.
2. Pull to refresh in app and confirm failure is surfaced clearly.
3. Restart backend server.
4. Pull to refresh again and confirm app recovers.

## Pass Criteria

- All checks complete without app crash.
- Booking and cancellation are reflected in both tabs.
- Badge count and filter counts stay consistent.
