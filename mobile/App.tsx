import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
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

function labelForStatus(value?: string) {
  const status = normalizeStatus(value);
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'active') return 'Active';
  if (status === 'booked') return 'Booked';
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Scheduled';
}

function AppButton({
  title,
  onPress,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'neutral' | 'danger';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.appButton,
        variant === 'neutral' ? styles.appButtonNeutral : null,
        variant === 'danger' ? styles.appButtonDanger : null,
        pressed && !disabled ? styles.appButtonPressed : null,
        disabled ? styles.appButtonDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.appButtonText,
          variant === 'neutral' ? styles.appButtonTextNeutral : null,
          disabled ? styles.appButtonTextDisabled : null,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
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
  const activeBookedClassIds = useMemo(() => new Set(activeBookings.map((b) => b.classId)), [activeBookings]);
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
              <AppButton title="Continue" onPress={onSignIn} />
            </View>
          </View>
        ) : null}

        <View style={styles.controls}>
          <AppButton
            title={healthChecking ? 'Checking...' : 'Check connection'}
            onPress={onCheckConnection}
            disabled={healthChecking || loading}
            variant="neutral"
          />
        </View>

        {isSignedIn ? (
          <View style={styles.profileRow}>
            <Text style={styles.profileText}>Signed in as {customerName} ({customerEmail})</Text>
            <AppButton title="Sign out" onPress={() => setIsSignedIn(false)} variant="neutral" />
          </View>
        ) : null}

        <View style={styles.controls}>
          <AppButton title="Clear profile" onPress={onClearProfile} variant="danger" />
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
                {activeBookedClassIds.has(item.id) ? (
                  <View style={styles.bookedBanner}>
                    <Text style={styles.bookedBannerText}>Already booked</Text>
                  </View>
                ) : null}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View
                    style={[
                      styles.statusChip,
                      normalizeStatus(item.status) === 'cancelled'
                        ? styles.statusChipCancelled
                        : styles.statusChipScheduled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        normalizeStatus(item.status) === 'cancelled'
                          ? styles.statusChipTextCancelled
                          : styles.statusChipTextScheduled,
                      ]}
                    >
                      {labelForStatus(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemSub}>{formatDate(item.startTime)}</Text>
                {item.location ? <Text style={styles.itemSub}>Location: {item.location}</Text> : null}
                <Text style={styles.itemSub}>Spots left: {item.spotsLeft ?? 'N/A'}</Text>
                <View style={styles.bookButtonWrap}>
                  <AppButton
                    title={
                      activeBookedClassIds.has(item.id)
                        ? 'Already booked'
                        : bookingClassId === item.id
                          ? 'Booking...'
                          : 'Book'
                    }
                    onPress={() => onBook(item.id)}
                    disabled={
                      activeBookedClassIds.has(item.id) ||
                      bookingClassId !== null ||
                      item.spotsLeft === 0 ||
                      item.status === 'cancelled'
                    }
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
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.itemTitle}>{booking.classTitle}</Text>
                    <View style={[styles.statusChip, styles.statusChipActive]}>
                      <Text style={[styles.statusChipText, styles.statusChipTextActive]}>
                        {labelForStatus(booking.bookingStatus)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemSub}>{formatDate(booking.classStartTime)}</Text>
                  <Text style={styles.itemSub}>Booking status: {booking.bookingStatus}</Text>
                  <Text style={styles.itemSub}>Class status: {booking.classStatus}</Text>
                  <View style={styles.bookButtonWrap}>
                    <AppButton
                      title={cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel booking'}
                      onPress={() => requestCancelBooking(booking)}
                      disabled={!canCancel || cancellingBookingId !== null}
                      variant="danger"
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
    backgroundColor: '#f3f4f6',
  },
  scrollContent: { paddingBottom: 28 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: 0.2 },
  subtitle: { marginTop: 6, color: '#4b5563', fontSize: 13 },
  loginCard: {
    margin: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  formRow: { padding: 12, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  controls: { paddingHorizontal: 12, paddingTop: 10 },
  tabRow: {
    paddingHorizontal: 12,
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: '#fff',
  },
  tabButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
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
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  badgeActive: {
    backgroundColor: '#f8fafc',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  badgeTextActive: {
    color: '#0f172a',
  },
  healthText: { paddingHorizontal: 12, color: '#6b7280', fontSize: 12, marginTop: 8 },
  healthStatus: { paddingHorizontal: 12, color: '#111827', marginTop: 4, fontWeight: '600' },
  profileRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  profileText: {
    color: '#374151',
    fontSize: 13,
  },
  loader: { marginTop: 10 },
  listContent: { padding: 12, gap: 10 },
  pullHint: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterPillText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#f8fafc',
  },
  filterSummary: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
  },
  emptyText: { color: '#6b7280' },
  card: {
    padding: 13,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  itemSub: { fontSize: 13, color: '#4b5563', marginTop: 4 },
  bookButtonWrap: { marginTop: 12 },
  bookedBanner: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  bookedBannerText: {
    color: '#065f46',
    fontSize: 11,
    fontWeight: '800',
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipScheduled: {
    backgroundColor: '#dbeafe',
  },
  statusChipCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusChipActive: {
    backgroundColor: '#dcfce7',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusChipTextScheduled: {
    color: '#1d4ed8',
  },
  statusChipTextCancelled: {
    color: '#b91c1c',
  },
  statusChipTextActive: {
    color: '#166534',
  },
  appButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  appButtonNeutral: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  appButtonDanger: {
    backgroundColor: '#dc2626',
  },
  appButtonPressed: {
    opacity: 0.9,
  },
  appButtonDisabled: {
    opacity: 0.5,
  },
  appButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  appButtonTextNeutral: {
    color: '#111827',
  },
  appButtonTextDisabled: {
    color: '#f3f4f6',
  },
  error: { color: '#dc2626', paddingHorizontal: 12 },
});
