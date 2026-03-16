import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  getSessionPassWallet,
  listClasses,
  listMyBookings,
  type MobileCompletedPass,
  type MobileBookingItem,
  type MobileClassItem,
  type MobileSessionPassWallet,
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

function toDayKey(value?: string | Date) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function labelForStatus(value?: string) {
  const status = normalizeStatus(value);
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'active') return 'Active';
  if (status === 'booked') return 'Booked';
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Scheduled';
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
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
  const [classesViewMode, setClassesViewMode] = useState<'list' | 'calendar'>('list');
  const [classFilter, setClassFilter] = useState<'upcoming' | 'all' | 'cancelled' | 'booked'>(
    'upcoming'
  );
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => toDayKey(new Date()));
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>('Not checked yet');
  const [bookingClassId, setBookingClassId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<MobileClassItem | null>(null);
  const [classes, setClasses] = useState<MobileClassItem[]>([]);
  const [myBookings, setMyBookings] = useState<MobileBookingItem[]>([]);
  const [sessionPassWallet, setSessionPassWallet] = useState<MobileSessionPassWallet | null>(null);
  const [sessionPassLoading, setSessionPassLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('Demo Member');
  const [customerEmail, setCustomerEmail] = useState('member@example.com');
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [profileHydrated, setProfileHydrated] = useState(false);
  const activeBookings = myBookings.filter((b) => b.bookingStatus === 'active');
  const activeBookingsCount = activeBookings.length;
  const activeBookedClassIds = useMemo(() => new Set(activeBookings.map((b) => b.classId)), [activeBookings]);
  const bookedCount = useMemo(
    () => classes.filter((item) => activeBookedClassIds.has(item.id)).length,
    [classes, activeBookedClassIds]
  );
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
        if (classFilter === 'booked') return activeBookedClassIds.has(item.id);

        if (status === 'cancelled') return false;
        const start = item.startTime ? new Date(item.startTime).getTime() : Number.NaN;
        if (Number.isNaN(start)) return true;
        return start >= Date.now();
      }),
    [classes, classFilter, activeBookedClassIds]
  );
  const classCountsByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of classes) {
      const key = toDayKey(item.startTime);
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [classes]);
  const monthLabel = useMemo(
    () => calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [calendarMonth]
  );
  const calendarCells = useMemo(() => {
    const first = startOfMonth(calendarMonth);
    const firstWeekday = first.getDay();
    const startCellDate = new Date(first);
    startCellDate.setDate(first.getDate() - firstWeekday);

    const cells: Array<{ dayKey: string; dayNumber: number; inMonth: boolean; count: number; isToday: boolean }> = [];
    const todayKey = toDayKey(new Date());

    for (let i = 0; i < 42; i++) {
      const date = new Date(startCellDate);
      date.setDate(startCellDate.getDate() + i);
      const dayKey = toDayKey(date) ?? '';
      cells.push({
        dayKey,
        dayNumber: date.getDate(),
        inMonth: date.getMonth() === calendarMonth.getMonth(),
        count: classCountsByDay.get(dayKey) ?? 0,
        isToday: dayKey === todayKey,
      });
    }
    return cells;
  }, [calendarMonth, classCountsByDay]);
  const classesForSelectedDay = useMemo(() => {
    if (!selectedCalendarDay) return [];
    return classes
      .filter((item) => toDayKey(item.startTime) === selectedCalendarDay)
      .sort((a, b) => {
        const ta = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tb = b.startTime ? new Date(b.startTime).getTime() : 0;
        return ta - tb;
      });
  }, [classes, selectedCalendarDay]);
  const selectedClassBooked = selectedClass ? activeBookedClassIds.has(selectedClass.id) : false;
  const sessionPass = sessionPassWallet?.sessionPass ?? null;
  const completedPasses: MobileCompletedPass[] = sessionPassWallet?.completedPasses ?? [];
  const sessionsUsed = sessionPass ? Math.max(0, sessionPass.total - sessionPass.remaining) : 0;
  const usagePercent = sessionPass && sessionPass.total > 0 ? (sessionsUsed / sessionPass.total) * 100 : 0;
  const isPassLow = sessionPass ? sessionPass.remaining > 0 && sessionPass.remaining <= 2 : false;
  const isPassEmpty = sessionPass ? sessionPass.remaining <= 0 : false;
  const latestPassActivity = sessionPass?.history.length
    ? [...sessionPass.history]
        .sort((a, b) => new Date(b.attendedDate).getTime() - new Date(a.attendedDate).getTime())
        .slice(0, 3)
    : [];
  const selectedClassBookButtonTitle = selectedClass
    ? selectedClassBooked
      ? 'Already booked'
      : bookingClassId === selectedClass.id
        ? 'Booking...'
        : selectedClass.status === 'cancelled'
          ? 'Cancelled'
          : selectedClass.spotsLeft === 0
            ? 'Full'
            : 'Book class'
    : 'Book class';

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listClasses();
      setClasses(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load'));
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

  async function bookClassNow(classId: string) {
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
      await loadSessionPassWallet(true);
    } catch (err) {
      const apiError = getErrorMessage(err, 'booking_failed');
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

  function onBook(classId: string) {
    const passSummary = sessionPass
      ? `You have ${sessionPass.remaining}/${sessionPass.total} sessions left.`
      : 'Session pass balance will refresh after booking.';
    const passNote = isPassEmpty
      ? 'Your pass has no sessions left. You can still reserve a spot, but check-in may require a new pass.'
      : 'If you attend this class, 1 session will be deducted at check-in.';

    Alert.alert('Confirm booking', `${passSummary}\n\n${passNote}`, [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Book class',
        onPress: () => {
          bookClassNow(classId).catch(() => {
            // Error handling is already done inside bookClassNow.
          });
        },
      },
    ]);
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
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load bookings');
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

  async function loadSessionPassWallet(silent = false) {
    const email = customerEmail.trim();
    if (!email) {
      setSessionPassWallet(null);
      return;
    }

    if (!silent) {
      setSessionPassLoading(true);
    }

    try {
      const wallet = await getSessionPassWallet(email);
      setSessionPassWallet(wallet);
    } catch {
      if (!silent) {
        Alert.alert('Session pass', 'Could not load your session pass wallet right now.');
      }
    } finally {
      if (!silent) {
        setSessionPassLoading(false);
      }
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
      await loadSessionPassWallet(true);
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
      await loadSessionPassWallet(true);
    } catch (err) {
      const message = getErrorMessage(err, 'Could not cancel booking');
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
    } catch {
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
  }, [profileHydrated, customerName, customerEmail, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    if (activeTab !== 'classes') return;
    // Auto-load classes when user opens the Classes tab.
    load();
  }, [activeTab, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    if (activeTab !== 'bookings') return;
    if (!customerEmail.trim()) return;
    // Auto-load bookings when user opens My Bookings with an email entered.
    onLoadMyBookings();
    loadSessionPassWallet(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, customerEmail, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setSessionPassWallet(null);
      return;
    }
    if (!customerEmail.trim()) return;
    loadSessionPassWallet(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, customerEmail]);

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

  function renderClassCard(item: MobileClassItem) {
    return (
      <View style={styles.card} key={item.id}>
        {activeBookedClassIds.has(item.id) ? (
          <View style={styles.bookedBanner}>
            <Text style={styles.bookedBannerText}>Already booked</Text>
          </View>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.cardTapArea, pressed ? styles.cardPressed : null]}
          onPress={() => setSelectedClass(item)}
        >
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
          <Text style={styles.detailsHint}>Tap for details</Text>
        </Pressable>
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
    );
  }

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

        {isSignedIn ? (
          <View style={styles.walletCard}>
            <View style={styles.walletHeaderRow}>
              <Text style={styles.walletTitle}>Session pass wallet</Text>
              {sessionPassLoading ? <ActivityIndicator size="small" /> : null}
            </View>

            {sessionPass ? (
              <>
                <Text style={styles.walletBalance}>
                  {sessionPass.remaining}/{sessionPass.total}
                </Text>
                <Text style={styles.walletSubText}>sessions remaining</Text>
                {sessionPass.purchaseDate ? (
                  <Text style={styles.walletMetaText}>
                    Purchased: {new Date(sessionPass.purchaseDate).toLocaleDateString()}
                  </Text>
                ) : null}

                <View style={styles.walletProgressTrack}>
                  <View
                    style={[
                      styles.walletProgressFill,
                      { width: `${Math.max(0, Math.min(100, usagePercent))}%` },
                      isPassEmpty ? styles.walletProgressFillEmpty : null,
                      isPassLow ? styles.walletProgressFillLow : null,
                    ]}
                  />
                </View>
                <Text style={styles.walletMetaText}>
                  {sessionsUsed} of {sessionPass.total} sessions used
                </Text>

                {isPassEmpty ? (
                  <Text style={styles.walletWarningText}>
                    Your pass is empty. Purchase a new pass before your next attended class.
                  </Text>
                ) : null}
                {isPassLow ? (
                  <Text style={styles.walletWarningText}>
                    Low balance: only {sessionPass.remaining} session
                    {sessionPass.remaining === 1 ? '' : 's'} left.
                  </Text>
                ) : null}

                <Text style={styles.walletSectionLabel}>Recent pass usage</Text>
                {latestPassActivity.length === 0 ? (
                  <Text style={styles.walletMetaText}>No attended sessions recorded yet.</Text>
                ) : (
                  latestPassActivity.map((entry) => (
                    <Text key={entry.id} style={styles.walletHistoryText}>
                      #{entry.sessionNumber} {entry.classTitle} on{' '}
                      {new Date(entry.attendedDate).toLocaleDateString()}
                    </Text>
                  ))
                )}

                <Text style={styles.walletSectionLabel}>
                  Completed passes: {completedPasses.length}
                </Text>
                {completedPasses.length > 0 ? (
                  <Text style={styles.walletMetaText}>
                    Latest completed on{' '}
                    {new Date(completedPasses[0].completedDate).toLocaleDateString()} ({completedPasses[0].sessionsCount}{' '}
                    sessions)
                  </Text>
                ) : (
                  <Text style={styles.walletMetaText}>No completed pass history yet.</Text>
                )}
              </>
            ) : (
              <Text style={styles.walletMetaText}>Wallet data will appear after your profile syncs.</Text>
            )}
          </View>
        ) : null}

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
            <View style={styles.viewModeRow}>
              <Pressable
                style={[styles.filterPill, classesViewMode === 'list' ? styles.filterPillActive : null]}
                onPress={() => setClassesViewMode('list')}
              >
                <Text style={[styles.filterPillText, classesViewMode === 'list' ? styles.filterPillTextActive : null]}>List</Text>
              </Pressable>
              <Pressable
                style={[styles.filterPill, classesViewMode === 'calendar' ? styles.filterPillActive : null]}
                onPress={() => setClassesViewMode('calendar')}
              >
                <Text style={[styles.filterPillText, classesViewMode === 'calendar' ? styles.filterPillTextActive : null]}>Calendar</Text>
              </Pressable>
            </View>

            {classesViewMode === 'list' ? (
              <>
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
                style={[styles.filterPill, classFilter === 'booked' ? styles.filterPillActive : null]}
                onPress={() => setClassFilter('booked')}
              >
                <Text style={[styles.filterPillText, classFilter === 'booked' ? styles.filterPillTextActive : null]}>Booked</Text>
              </Pressable>
              <Pressable
                style={[styles.filterPill, classFilter === 'cancelled' ? styles.filterPillActive : null]}
                onPress={() => setClassFilter('cancelled')}
              >
                <Text style={[styles.filterPillText, classFilter === 'cancelled' ? styles.filterPillTextActive : null]}>Cancelled</Text>
              </Pressable>
            </View>

            <Text style={styles.filterSummary}>
              Showing {filteredClasses.length} of {classes.length} class(es). Upcoming now: {upcomingCount}. Booked: {bookedCount}. Cancelled: {cancelledCount}.
            </Text>

            {filteredClasses.length === 0 ? <Text style={styles.emptyText}>No classes in this view.</Text> : null}
            {filteredClasses.map(renderClassCard)}
              </>
            ) : (
              <>
                <View style={styles.calendarHeaderRow}>
                  <Pressable
                    style={styles.calendarNavButton}
                    onPress={() => setCalendarMonth((prev) => addMonths(prev, -1))}
                  >
                    <Text style={styles.calendarNavButtonText}>{'<'}</Text>
                  </Pressable>
                  <Text style={styles.calendarMonthLabel}>{monthLabel}</Text>
                  <Pressable
                    style={styles.calendarNavButton}
                    onPress={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                  >
                    <Text style={styles.calendarNavButtonText}>{'>'}</Text>
                  </Pressable>
                </View>

                <View style={styles.calendarWeekRow}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Text key={day} style={styles.calendarWeekLabel}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarCells.map((cell) => (
                    <Pressable
                      key={cell.dayKey}
                      style={[
                        styles.calendarCell,
                        !cell.inMonth ? styles.calendarCellOutside : null,
                        selectedCalendarDay === cell.dayKey ? styles.calendarCellSelected : null,
                      ]}
                      onPress={() => setSelectedCalendarDay(cell.dayKey)}
                    >
                      <Text
                        style={[
                          styles.calendarCellDay,
                          !cell.inMonth ? styles.calendarCellDayOutside : null,
                          cell.isToday ? styles.calendarCellDayToday : null,
                          selectedCalendarDay === cell.dayKey ? styles.calendarCellDaySelected : null,
                        ]}
                      >
                        {cell.dayNumber}
                      </Text>
                      {cell.count > 0 ? (
                        <View style={styles.calendarCountBadge}>
                          <Text style={styles.calendarCountText}>{cell.count}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>
                  {selectedCalendarDay
                    ? `Classes on ${new Date(`${selectedCalendarDay}T12:00:00`).toLocaleDateString()}`
                    : 'Select a date'}
                </Text>
                {classesForSelectedDay.length === 0 ? (
                  <Text style={styles.emptyText}>No classes on this date.</Text>
                ) : null}
                {classesForSelectedDay.map(renderClassCard)}
              </>
            )}
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

      <Modal
        visible={selectedClass !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedClass(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedClass(null)} />
          {selectedClass ? (
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{selectedClass.title}</Text>
              <Text style={styles.modalSub}>{formatDate(selectedClass.startTime)}</Text>
              {selectedClass.location ? (
                <Text style={styles.modalSub}>Location: {selectedClass.location}</Text>
              ) : null}
              <Text style={styles.modalSub}>Spots left: {selectedClass.spotsLeft ?? 'N/A'}</Text>
              <Text style={styles.modalSub}>Status: {labelForStatus(selectedClass.status)}</Text>
              {selectedClassBooked ? (
                <Text style={styles.modalBookedText}>You have already booked this class.</Text>
              ) : null}

              <View style={styles.modalActions}>
                <AppButton
                  title={selectedClassBookButtonTitle}
                  onPress={() => onBook(selectedClass.id)}
                  disabled={
                    selectedClassBooked ||
                    bookingClassId !== null ||
                    selectedClass.spotsLeft === 0 ||
                    selectedClass.status === 'cancelled'
                  }
                />
                <AppButton title="Close" onPress={() => setSelectedClass(null)} variant="neutral" />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
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
  walletCard: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    gap: 6,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  walletBalance: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: '#1e3a8a',
  },
  walletSubText: {
    color: '#1e40af',
    fontSize: 13,
    fontWeight: '700',
  },
  walletMetaText: {
    color: '#334155',
    fontSize: 12,
  },
  walletProgressTrack: {
    marginTop: 4,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    overflow: 'hidden',
  },
  walletProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  walletProgressFillLow: {
    backgroundColor: '#d97706',
  },
  walletProgressFillEmpty: {
    backgroundColor: '#dc2626',
  },
  walletWarningText: {
    marginTop: 2,
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
  },
  walletSectionLabel: {
    marginTop: 6,
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  walletHistoryText: {
    color: '#1f2937',
    fontSize: 12,
  },
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
  viewModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
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
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  calendarNavButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavButtonText: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
  },
  calendarMonthLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarWeekLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  calendarCell: {
    width: '13.6%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  calendarCellOutside: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  calendarCellSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  calendarCellDay: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '700',
  },
  calendarCellDayOutside: {
    color: '#9ca3af',
  },
  calendarCellDayToday: {
    textDecorationLine: 'underline',
  },
  calendarCellDaySelected: {
    color: '#ffffff',
  },
  calendarCountBadge: {
    marginTop: 4,
    minWidth: 20,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  calendarCountText: {
    fontSize: 10,
    color: '#1d4ed8',
    fontWeight: '800',
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
  cardTapArea: {
    borderRadius: 10,
    padding: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  detailsHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalSub: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  modalBookedText: {
    marginTop: 8,
    color: '#065f46',
    fontWeight: '700',
    fontSize: 13,
  },
  modalActions: {
    marginTop: 14,
    gap: 10,
  },
  error: { color: '#dc2626', paddingHorizontal: 12 },
});
