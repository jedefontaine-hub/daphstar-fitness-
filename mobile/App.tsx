import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  Button,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BASE_URL,
  bookClass,
  cancelMyBooking,
  checkApiHealth,
  listClasses,
  listMyBookings,
  type MobileBookingItem,
  type MobileClassItem,
} from './api';

const PROFILE_STORAGE_KEY = 'daphstar.mobile.profile';

function formatDate(value?: string) {
  if (!value) return 'Time TBC';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function normalizeStatus(value?: string) {
  return (value ?? '').trim().toLowerCase();
}

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'classes' | 'bookings'>('classes');
  const [classFilter, setClassFilter] = useState<'upcoming' | 'all' | 'cancelled'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>('Not checked yet');
  const [bookingClassId, setBookingClassId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [classes, setClasses] = useState<MobileClassItem[]>([]);
  const [myBookings, setMyBookings] = useState<MobileBookingItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('Demo Member');
  const [customerEmail, setCustomerEmail] = useState('member@example.com');
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [profileHydrated, setProfileHydrated] = useState(false);
  const activeBookings = myBookings.filter((b) => b.bookingStatus === 'active');
  const activeBookingsCount = activeBookings.length;
  const upcomingCount = useMemo(
    () =>
      classes.filter((item) => {
        const status = normalizeStatus(item.status);
        if (status === 'cancelled') return false;
        const start = item.startTime ? new Date(item.startTime).getTime() : Number.NaN;
        if (Number.isNaN(start)) return true;
        return start >= Date.now();
      }).length,
    [classes]
  );
  const cancelledCount = useMemo(
    () => classes.filter((item) => normalizeStatus(item.status) === 'cancelled').length,
    [classes]
  );
  const filteredClasses = useMemo(
    () =>
      classes.filter((item) => {
        const status = normalizeStatus(item.status);
        if (classFilter === 'all') return true;
        if (classFilter === 'cancelled') return status === 'cancelled';

        if (status === 'cancelled') return false;
        const start = item.startTime ? new Date(item.startTime).getTime() : Number.NaN;
        if (Number.isNaN(start)) return true;
        return start >= Date.now();
      }),
    [classes, classFilter]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listClasses();
      setClasses(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function onCheckConnection() {
    setHealthChecking(true);
    try {
      const result = await checkApiHealth();
      if (result.ok) {
        setHealthStatus(`Connected (HTTP ${result.status ?? 200})`);
      } else if (result.status) {
        setHealthStatus(`Backend reachable but error HTTP ${result.status}`);
      } else {
        setHealthStatus('Cannot reach backend from phone. Check Wi-Fi and backend server.');
      }
    } finally {
      setHealthChecking(false);
    }
  }

  async function onBook(classId: string) {
    if (!customerName.trim() || !customerEmail.trim()) {
      Alert.alert('Missing details', 'Please enter your name and email first.');
      return;
    }

    setBookingClassId(classId);
    try {
      await bookClass({
        classId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
      });
      Alert.alert('Booked', 'Your booking was created successfully.');
      await load();
      await refreshMyBookingsSilently();
    } catch (err: any) {
      const apiError = err?.message ?? 'booking_failed';
      const friendly =
        apiError === 'already_booked'
          ? 'You already booked this class.'
          : apiError === 'class_full'
            ? 'This class is full.'
            : apiError === 'class_cancelled'
              ? 'This class has been cancelled.'
              : 'Could not create booking. Try again.';
      Alert.alert('Booking failed', friendly);
    } finally {
      setBookingClassId(null);
    }
  }

  async function onLoadMyBookings() {
    const email = customerEmail.trim();
    if (!email) {
      Alert.alert('Missing email', 'Enter your email to find your bookings.');
      return;
    }

    setBookingsLoading(true);
    try {
      const bookings = await listMyBookings(email);
      setMyBookings(bookings);
    } catch (err: any) {
      const message = err?.message ?? 'Failed to load bookings';
      Alert.alert('My bookings', message);
    } finally {
      setBookingsLoading(false);
    }
  }

  async function refreshMyBookingsSilently() {
    const email = customerEmail.trim();
    if (!email) return;

    try {
      const bookings = await listMyBookings(email);
      setMyBookings(bookings);
    } catch {
      // Keep existing UI state if background refresh fails.
    }
  }

  async function onPullRefresh() {
    if (!isSignedIn) return;
    setIsPullRefreshing(true);
    try {
      if (activeTab === 'classes') {
        await load();
      } else {
        await onLoadMyBookings();
      }
    } finally {
      setIsPullRefreshing(false);
    }
  }

  async function onCancelBooking(booking: MobileBookingItem) {
    setCancellingBookingId(booking.id);
    try {
      await cancelMyBooking(booking.cancelToken);
      Alert.alert('Cancelled', 'Your booking was cancelled.');
      await onLoadMyBookings();
      await load();
    } catch (err: any) {
      const message = err?.message ?? 'Could not cancel booking';
      Alert.alert('Cancel failed', message);
    } finally {
      setCancellingBookingId(null);
    }
  }

  function requestCancelBooking(booking: MobileBookingItem) {
    Alert.alert(
      'Cancel this booking?',
      `${booking.classTitle} on ${formatDate(booking.classStartTime)}`,
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () => {
            onCancelBooking(booking).catch(() => {
              // Error handling is already done inside onCancelBooking.
            });
          },
        },
      ]
    );
  }

  async function onClearProfile() {
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      setCustomerName('');
      setCustomerEmail('');
      setLoginName('');
      setLoginEmail('');
      setIsSignedIn(false);
      setMyBookings([]);
      Alert.alert('Profile cleared', 'Saved name and email were removed from this device.');
    } catch (e) {
      Alert.alert('Clear failed', 'Could not clear saved profile. Please try again.');
    }
  }

  function onSignIn() {
    const name = loginName.trim();
    const email = loginEmail.trim().toLowerCase();

    if (!name || !email) {
      Alert.alert('Missing details', 'Please enter your name and email to continue.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setCustomerName(name);
    setCustomerEmail(email);
    setIsSignedIn(true);
  }

  useEffect(() => {
    let mounted = true;

    async function restoreProfile() {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (!raw || !mounted) {
          return;
        }

        const parsed = JSON.parse(raw) as { name?: string; email?: string };
        if (typeof parsed?.name === 'string') {
          setCustomerName(parsed.name);
          setLoginName(parsed.name);
        }
        if (typeof parsed?.email === 'string') {
          setCustomerEmail(parsed.email);
          setLoginEmail(parsed.email);
        }
        if (parsed?.name && parsed?.email) {
          setIsSignedIn(true);
        }
      } catch (e) {
        console.warn('Profile restore failed', e);
      } finally {
        if (mounted) {
          setProfileHydrated(true);
        }
      }
    }

    restoreProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profileHydrated || !isSignedIn) return;

    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          name: customerName,
          email: customerEmail,
        })
      ).catch((e) => console.warn('Profile save failed', e));
    }, 200);

    return () => clearTimeout(timer);
  }, [profileHydrated, customerName, customerEmail]);

  useEffect(() => {
    if (!isSignedIn) return;
    if (activeTab !== 'classes') return;
    // Auto-load classes when user opens the Classes tab.
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    if (activeTab !== 'bookings') return;
    if (!customerEmail.trim()) return;
    // Auto-load bookings when user opens My Bookings with an email entered.
    onLoadMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, customerEmail, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    if (!customerEmail.trim()) return;

    // Keep My Bookings badge in sync even when user stays on Classes tab.
    refreshMyBookingsSilently();

    const interval = setInterval(() => {
      refreshMyBookingsSilently();
    }, 15000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, customerEmail]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={onPullRefresh}
            enabled={isSignedIn}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Daphstar Mobile</Text>
          <Text style={styles.subtitle}>
            {isSignedIn ? 'Browse classes and manage your bookings' : 'Sign in to continue'}
          </Text>
        </View>

        {!isSignedIn ? (
          <View style={styles.loginCard}>
            <Text style={styles.sectionTitle}>Welcome</Text>
            <Text style={styles.emptyText}>Enter your details once to access classes and bookings.</Text>

            <View style={styles.formRow}>
              <TextInput
                value={loginName}
                onChangeText={setLoginName}
                placeholder="Your name"
                style={styles.input}
              />
              <TextInput
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder="Your email"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.controls}>
              <Button title="Continue" onPress={onSignIn} />
            </View>
          </View>
        ) : null}

        <View style={styles.controls}>
          <Button title={healthChecking ? 'Checking...' : 'Check connection'} onPress={onCheckConnection} disabled={healthChecking || loading} />
        </View>

        {isSignedIn ? (
          <View style={styles.profileRow}>
            <Text style={styles.profileText}>Signed in as {customerName} ({customerEmail})</Text>
            <Button title="Sign out" onPress={() => setIsSignedIn(false)} />
          </View>
        ) : null}

        <View style={styles.controls}>
          <Button title="Clear profile" onPress={onClearProfile} />
        </View>

        <Text style={styles.healthText}>API: {BASE_URL}</Text>
        <Text style={styles.healthStatus}>{healthStatus}</Text>

        {isSignedIn ? <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabButton, activeTab === 'classes' ? styles.tabButtonActive : null]}
            onPress={() => setActiveTab('classes')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'classes' ? styles.tabButtonTextActive : null]}>Classes</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'bookings' ? styles.tabButtonActive : null]}
            onPress={() => setActiveTab('bookings')}
          >
            <View style={styles.tabLabelRow}>
              <Text style={[styles.tabButtonText, activeTab === 'bookings' ? styles.tabButtonTextActive : null]}>My Bookings</Text>
              <View style={[styles.badge, activeTab === 'bookings' ? styles.badgeActive : null]}>
                <Text style={[styles.badgeText, activeTab === 'bookings' ? styles.badgeTextActive : null]}>{activeBookingsCount}</Text>
              </View>
            </View>
          </Pressable>
        </View> : null}

        {loading && activeTab === 'classes' ? <ActivityIndicator size="large" style={styles.loader} /> : null}
        {bookingsLoading && activeTab === 'bookings' ? <ActivityIndicator size="large" style={styles.loader} /> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isSignedIn && activeTab === 'classes' ? (
          <View style={styles.listContent}>
            <Text style={styles.sectionTitle}>Available classes</Text>
            <Text style={styles.pullHint}>Pull down to refresh this list.</Text>
            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterPill, classFilter === 'upcoming' ? styles.filterPillActive : null]}
                onPress={() => setClassFilter('upcoming')}
              >
                <Text style={[styles.filterPillText, classFilter === 'upcoming' ? styles.filterPillTextActive : null]}>Upcoming</Text>
              </Pressable>
              <Pressable
                style={[styles.filterPill, classFilter === 'all' ? styles.filterPillActive : null]}
                onPress={() => setClassFilter('all')}
              >
                <Text style={[styles.filterPillText, classFilter === 'all' ? styles.filterPillTextActive : null]}>All</Text>
              </Pressable>
              <Pressable
                style={[styles.filterPill, classFilter === 'cancelled' ? styles.filterPillActive : null]}
                onPress={() => setClassFilter('cancelled')}
              >
                <Text style={[styles.filterPillText, classFilter === 'cancelled' ? styles.filterPillTextActive : null]}>Cancelled</Text>
              </Pressable>
            </View>

            <Text style={styles.filterSummary}>Showing {filteredClasses.length} of {classes.length} class(es). Upcoming now: {upcomingCount}. Cancelled: {cancelledCount}.</Text>

            {filteredClasses.length === 0 ? <Text style={styles.emptyText}>No classes in this view.</Text> : null}
            {filteredClasses.map((item) => (
              <View style={styles.card} key={item.id}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>{formatDate(item.startTime)}</Text>
                {item.location ? <Text style={styles.itemSub}>Location: {item.location}</Text> : null}
                <Text style={styles.itemSub}>Spots left: {item.spotsLeft ?? 'N/A'}</Text>
                <View style={styles.bookButtonWrap}>
                  <Button
                    title={bookingClassId === item.id ? 'Booking...' : 'Book'}
                    onPress={() => onBook(item.id)}
                    disabled={bookingClassId !== null || item.spotsLeft === 0 || item.status === 'cancelled'}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : isSignedIn ? (
          <View style={styles.listContent}>
            <Text style={styles.sectionTitle}>My bookings</Text>
            <Text style={styles.pullHint}>Pull down to refresh this list.</Text>
            {activeBookings.length === 0 ? <Text style={styles.emptyText}>No active bookings.</Text> : null}
            {activeBookings.map((booking) => {
              const canCancel = booking.bookingStatus === 'active' && booking.classStatus !== 'cancelled';
              return (
                <View style={styles.card} key={booking.id}>
                  <Text style={styles.itemTitle}>{booking.classTitle}</Text>
                  <Text style={styles.itemSub}>{formatDate(booking.classStartTime)}</Text>
                  <Text style={styles.itemSub}>Booking status: {booking.bookingStatus}</Text>
                  <Text style={styles.itemSub}>Class status: {booking.classStatus}</Text>
                  <View style={styles.bookButtonWrap}>
                    <Button
                      title={cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel booking'}
                      onPress={() => requestCancelBooking(booking)}
                      disabled={!canCancel || cancellingBookingId !== null}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: { paddingBottom: 24 },
  header: { padding: 16, borderBottomWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitle: { marginTop: 4, color: '#475569' },
  loginCard: {
    margin: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  formRow: { padding: 12, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  controls: { padding: 12 },
  tabRow: {
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#334155',
  },
  tabButtonTextActive: {
    color: '#f8fafc',
  },
  tabLabelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  badgeActive: {
    backgroundColor: '#f8fafc',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeTextActive: {
    color: '#0f172a',
  },
  healthText: { paddingHorizontal: 12, color: '#475569', fontSize: 12 },
  healthStatus: { paddingHorizontal: 12, color: '#0f172a', marginTop: 4 },
  profileRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  profileText: {
    color: '#334155',
  },
  loader: { marginTop: 8 },
  listContent: { padding: 12, gap: 8 },
  pullHint: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fff',
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterPillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#f8fafc',
  },
  filterSummary: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 6,
  },
  emptyText: { color: '#64748b' },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  itemTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  itemSub: { fontSize: 13, color: '#475569', marginTop: 4 },
  bookButtonWrap: { marginTop: 10 },
  error: { color: '#dc2626', paddingHorizontal: 12 },
});
