"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminCancelClass,
  adminCreateClass,
  adminUpdateClass,
  fetchAdminClasses,
  fetchAttendees,
  type AdminClassSummary,
  type Attendee,
} from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  getWeekDates,
  getMonthDates,
  isSameDay,
  formatTime,
  formatWeekRange,
  formatMonthYear,
} from "@/lib/utils/date";

type PageStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string };

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; classItem: AdminClassSummary }
  | { type: "attendees"; classItem: AdminClassSummary; attendees: Attendee[] }
  | { type: "cancelConfirm"; classItem: AdminClassSummary }
  | { type: "editCustomer"; customer: Customer }
  | { type: "createCustomer" }
  | { type: "deleteCustomerConfirm"; customer: Customer }
  | { type: "deleteVillageConfirm"; village: Village }
  | { type: "bulkCancelConfirm"; classIds: string[] };

type Customer = {
  id: string;
  name: string;
  email: string;
  retirementVillage: string | null;
  birthdate: string | null;
  phone: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  sessionPassRemaining: number;
  sessionPassTotal: number;
  sessionPassPurchaseDate: string | null;
  createdAt: string;
  _count?: { bookings: number };
};

type Village = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type Tab = "classes" | "customers" | "villages";

function formatDateRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return "Time TBD";
  }
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  const endTimeText = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end);
  return `${day} - ${endTimeText}`;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type CustomerWithPass = {
  id: string;
  name: string;
  email: string;
  retirementVillage: string | null;
  sessionPassRemaining?: number;
};

export default function AdminPage() {
  const toast = useToast();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("classes");

  // Classes state
  const [classes, setClasses] = useState<AdminClassSummary[]>([]);
  const [classesStatus, setClassesStatus] = useState<PageStatus>({ state: "loading" });
  const [isRecurring, setIsRecurring] = useState(false);
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [classLocationFilter, setClassLocationFilter] = useState<string>("all");
  const [expiredPasses, setExpiredPasses] = useState<CustomerWithPass[]>([]);
  const [lowPasses, setLowPasses] = useState<CustomerWithPass[]>([]);
  const [showExpiredPasses, setShowExpiredPasses] = useState(true);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [classViewMode, setClassViewMode] = useState<"list" | "week" | "month">("month");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState(new Date());
  const hasAutoFocusedUpcomingClass = useRef(false);

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersStatus, setCustomersStatus] = useState<PageStatus>({ state: "idle" });
  const [customerSearch, setCustomerSearch] = useState("");

  // Villages state
  const [villages, setVillages] = useState<Village[]>([]);
  const [villagesStatus, setVillagesStatus] = useState<PageStatus>({ state: "idle" });
  const [newVillageName, setNewVillageName] = useState("");

  const [modal, setModal] = useState<ModalState>({ type: "none" });


  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/admin/login");
        } else {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // Classes functions
  const loadClasses = async () => {
    setClassesStatus({ state: "loading" });
    try {
      const data = await fetchAdminClasses();
      setClasses(data);

      if (!hasAutoFocusedUpcomingClass.current && data.length > 0) {
        const now = new Date();
        const upcomingClass = data
          .filter((item) => item.status === "scheduled" && new Date(item.endTime) >= now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

        const targetDate = new Date((upcomingClass ?? data[0])?.startTime ?? now.toISOString());
        if (!Number.isNaN(targetDate.valueOf())) {
          setCalendarDate(targetDate);
          setSelectedCalDate(targetDate);
          hasAutoFocusedUpcomingClass.current = true;
        }
      }

      setClassesStatus({ state: "idle" });
    } catch (error) {
      setClassesStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Unable to load classes.",
      });
    }
  };

  const loadExpiredPasses = async () => {
    try {
      const res = await fetch("/api/admin/session-passes");
      if (res.ok) {
        const data = await res.json();
        setExpiredPasses(data.expired || []);
        setLowPasses(data.low || []);
      }
    } catch {
      // Silently fail
    }
  };

  const handlePurchasePass = async (customerId: string, customerName: string) => {
    try {
      const res = await fetch("/api/admin/session-passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, sessionCount: 10 }),
      });

      if (res.ok) {
        toast.success(`New 10-session pass activated for ${customerName}`);
        loadExpiredPasses();
        if (activeTab === "customers") loadCustomers();
      } else {
        toast.error("Failed to purchase pass");
      }
    } catch {
      toast.error("Failed to purchase pass");
    }
  };

  // Customers functions
  const loadCustomers = async () => {
    setCustomersStatus({ state: "loading" });
    try {
      const res = await fetch("/api/admin/customers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomers(data);
      setCustomersStatus({ state: "idle" });
    } catch {
      setCustomersStatus({ state: "error", message: "Unable to load customers." });
    }
  };

  // Villages functions
  const loadVillages = async () => {
    setVillagesStatus({ state: "loading" });
    try {
      const res = await fetch("/api/admin/villages");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setVillages(data);
      setVillagesStatus({ state: "idle" });
    } catch {
      setVillagesStatus({ state: "error", message: "Unable to load villages." });
    }
  };

  const handleAddVillage = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newVillageName.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/admin/villages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error === "village_exists") {
          toast.error("Village already exists");
        } else {
          toast.error("Failed to add village");
        }
        return;
      }

      toast.success("Village added successfully");
      setNewVillageName("");
      loadVillages();
    } catch {
      toast.error("Failed to add village");
    }
  };

  const handleDeleteVillage = async () => {
    if (modal.type !== "deleteVillageConfirm") return;

    try {
      const res = await fetch(`/api/admin/villages/${modal.village.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Village deleted successfully");
      handleCloseModal();
      loadVillages();
    } catch {
      toast.error("Failed to delete village");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    setSelectedClassIds(new Set());
    if (activeTab === "classes") {
      loadClasses();
      loadExpiredPasses();
      loadVillages();
    } else if (activeTab === "customers") {
      loadCustomers();
      loadVillages();
    } else if (activeTab === "villages") {
      loadVillages();
    }
  }, [activeTab, isAuthenticated]);

  const handleOpenCreate = () => setModal({ type: "create" });
  const handleOpenEdit = (classItem: AdminClassSummary) =>
    setModal({ type: "edit", classItem });

  const handleOpenAttendees = async (classItem: AdminClassSummary) => {
    try {
      const attendees = await fetchAttendees(classItem.id);
      setModal({ type: "attendees", classItem, attendees });
    } catch {
      alert("Failed to load attendees.");
    }
  };

  const handleOpenCancelConfirm = (classItem: AdminClassSummary) =>
    setModal({ type: "cancelConfirm", classItem });

  const handleCloseModal = () => {
    setModal({ type: "none" });
    setIsRecurring(false);
    setApplyToSeries(false);
  };

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const capacity = Number(formData.get("capacity"));
    const location = formData.get("location") as string;
    const repeatWeeks = isRecurring ? Number(formData.get("repeatWeeks")) : 1;

    if (!title || !startTime || !endTime || !capacity) {
      alert("All fields are required.");
      return;
    }

    try {
      await adminCreateClass({
        title,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        capacity,
        location: location || undefined,
        recurring: isRecurring,
        repeatWeeks: isRecurring ? repeatWeeks : undefined,
      });
      handleCloseModal();
      loadClasses();
      toast.success("Class created successfully");
    } catch {
      alert("Failed to create class.");
    }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (modal.type !== "edit") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const capacity = Number(formData.get("capacity"));
    const location = (formData.get("location") as string) || undefined;

    try {
      await adminUpdateClass(modal.classItem.id, {
        title,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        capacity,
        location,
      }, { applyToSeries });
      handleCloseModal();
      loadClasses();
      toast.success(applyToSeries ? "All future classes in series updated" : "Class updated successfully");
    } catch {
      alert("Failed to update class.");
    }
  };

  const handleCancelClass = async (cancelSeries = false) => {
    if (modal.type !== "cancelConfirm") return;
    try {
      await adminCancelClass(modal.classItem.id, { applyToSeries: cancelSeries });
      handleCloseModal();
      loadClasses();
      toast.success(cancelSeries ? "All future classes in series cancelled" : "Class cancelled");
    } catch {
      alert("Failed to cancel class.");
    }
  };

  const handleBulkCancel = async () => {
    if (modal.type !== "bulkCancelConfirm") return;
    try {
      await Promise.all(modal.classIds.map((id) => adminCancelClass(id)));
      handleCloseModal();
      setSelectedClassIds(new Set());
      loadClasses();
      toast.success(`${modal.classIds.length} classes cancelled`);
    } catch {
      alert("Failed to cancel some classes.");
    }
  };

  const toggleClassSelection = (id: string) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredClasses = (classLocationFilter === "all"
    ? classes
    : classes.filter((c) => c.location === classLocationFilter)
  )
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const selectableClasses = filteredClasses.filter((c) => c.status !== "cancelled" && new Date(c.endTime) >= new Date());
  const allSelected = selectableClasses.length > 0 && selectableClasses.every((c) => selectedClassIds.has(c.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedClassIds(new Set());
    } else {
      setSelectedClassIds(new Set(selectableClasses.map((c) => c.id)));
    }
  };

  // Calendar helpers
  const calWeekDates = getWeekDates(calendarDate);
  const calMonthDates = getMonthDates(calendarDate);
  const today = new Date();

  const getClassesForDay = (date: Date) =>
    filteredClasses.filter((c) => isSameDay(new Date(c.startTime), date));

  const navigateCalPrev = () => {
    const d = new Date(calendarDate);
    if (classViewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCalendarDate(d);
  };

  const navigateCalNext = () => {
    const d = new Date(calendarDate);
    if (classViewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCalendarDate(d);
  };

  const goToCalToday = () => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedCalDate(now);
  };

  const nextUpcomingClass = filteredClasses.find(
    (item) => item.status === "scheduled" && new Date(item.endTime) >= new Date()
  );

  const goToNextClass = () => {
    if (!nextUpcomingClass) return;
    const nextDate = new Date(nextUpcomingClass.startTime);
    if (Number.isNaN(nextDate.valueOf())) return;
    setCalendarDate(nextDate);
    setSelectedCalDate(nextDate);
  };

  // Customer CRUD operations
  const handleCreateCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password") || "changeme",
          retirementVillage: formData.get("retirementVillage") || null,
          birthdate: formData.get("birthdate") || null,
          phone: formData.get("phone") || null,
          address: formData.get("address") || null,
          emergencyContactName: formData.get("emergencyContactName") || null,
          emergencyContactPhone: formData.get("emergencyContactPhone") || null,
          sessionPassRemaining: Number(formData.get("sessionPassRemaining")) || 10,
          sessionPassTotal: Number(formData.get("sessionPassTotal")) || 10,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error === "email_exists") {
          toast.error("Email already exists");
        } else {
          toast.error("Failed to create customer");
        }
        return;
      }

      toast.success("Customer created successfully");
      handleCloseModal();
      loadCustomers();
    } catch {
      toast.error("Failed to create customer");
    }
  };

  const handleUpdateCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (modal.type !== "editCustomer") return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/admin/customers/${modal.customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          retirementVillage: formData.get("retirementVillage") || null,
          birthdate: formData.get("birthdate") || null,
          phone: formData.get("phone") || null,
          address: formData.get("address") || null,
          emergencyContactName: formData.get("emergencyContactName") || null,
          emergencyContactPhone: formData.get("emergencyContactPhone") || null,
          sessionPassRemaining: Number(formData.get("sessionPassRemaining")),
          sessionPassTotal: Number(formData.get("sessionPassTotal")),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error === "email_exists") {
          toast.error("Email already exists");
        } else {
          toast.error("Failed to update customer");
        }
        return;
      }

      toast.success("Customer updated successfully");
      handleCloseModal();
      loadCustomers();
    } catch {
      toast.error("Failed to update customer");
    }
  };

  const handleDeleteCustomer = async () => {
    if (modal.type !== "deleteCustomerConfirm") return;

    try {
      const res = await fetch(`/api/admin/customers/${modal.customer.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Customer deleted successfully");
      handleCloseModal();
      loadCustomers();
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.retirementVillage && c.retirementVillage.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid px-6 py-10">
      {/* Gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-violet-500/10 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-6">
        <header className="glass-card flex items-start justify-between rounded-3xl p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-purple-400">
              Daphstar Fitness
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage classes, customers, and villages.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
          >
            Sign out
          </button>
        </header>

        {/* Tabs */}
        <div className="glass-card rounded-3xl p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("classes")}
              className={`flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition ${
                activeTab === "classes"
                  ? "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Classes
            </button>
            <button
              onClick={() => setActiveTab("customers")}
              className={`flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition ${
                activeTab === "customers"
                  ? "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveTab("villages")}
              className={`flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition ${
                activeTab === "villages"
                  ? "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Villages
            </button>
          </div>
        </div>

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <>
            {/* Session Pass Alerts */}
            {(expiredPasses.length > 0 || lowPasses.length > 0) && (
              <section className="glass-card rounded-3xl p-6 border-2 border-rose-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                      <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Session Pass Alerts</h2>
                      <p className="text-sm text-slate-400">
                        {expiredPasses.length} expired · {lowPasses.length} low balance
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExpiredPasses(!showExpiredPasses)}
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    {showExpiredPasses ? "Hide" : "Show"}
                  </button>
                </div>

                {showExpiredPasses && (
                  <div className="space-y-4">
                    {/* Expired Passes */}
                    {expiredPasses.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-rose-400 mb-2">
                          Expired Passes ({expiredPasses.length})
                        </h3>
                        <div className="space-y-2">
                          {expiredPasses.map((customer) => (
                            <div
                              key={customer.id}
                              className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 p-4"
                            >
                              <div>
                                <p className="font-medium text-white">{customer.name}</p>
                                <p className="text-sm text-slate-400">{customer.email}</p>
                                {customer.retirementVillage && (
                                  <p className="text-xs text-slate-500 mt-1">{customer.retirementVillage}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handlePurchasePass(customer.id, customer.name)}
                                className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition"
                              >
                                Activate New Pass
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Low Balance Passes */}
                    {lowPasses.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-amber-400 mb-2">
                          Low Balance ({lowPasses.length})
                        </h3>
                        <div className="space-y-2">
                          {lowPasses.map((customer) => (
                            <div
                              key={customer.id}
                              className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"
                            >
                              <div>
                                <p className="font-medium text-white">{customer.name}</p>
                                <p className="text-sm text-slate-400">
                                  {customer.email} · {customer.sessionPassRemaining} sessions left
                                </p>
                                {customer.retirementVillage && (
                                  <p className="text-xs text-slate-500 mt-1">{customer.retirementVillage}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handlePurchasePass(customer.id, customer.name)}
                                className="rounded-full border border-teal-500/30 bg-teal-500/20 px-4 py-2 text-sm font-semibold text-teal-300 hover:bg-teal-500/30 transition"
                              >
                                Renew Pass
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            <section className="glass-card rounded-3xl p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">Classes</h2>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                    {filteredClasses.length} loaded
                  </span>
                  <select
                    value={classLocationFilter}
                    onChange={(e) => { setClassLocationFilter(e.target.value); setSelectedClassIds(new Set()); }}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-purple-400 focus:outline-none"
                  >
                    <option value="all">All Villages</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                  {selectableClasses.length > 0 && (
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400 hover:text-slate-300">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-white/5 accent-purple-500"
                      />
                      Select all
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {selectedClassIds.size > 0 && (
                    <button
                      className="rounded-full border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/20"
                      type="button"
                      onClick={() => setModal({ type: "bulkCancelConfirm", classIds: Array.from(selectedClassIds) })}
                    >
                      Cancel Selected ({selectedClassIds.size})
                    </button>
                  )}
                  {/* View mode toggle */}
                  <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
                    {(["list", "week", "month"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setClassViewMode(mode)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                          classViewMode === mode
                            ? "bg-purple-500/30 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                    type="button"
                    onClick={handleOpenCreate}
                  >
                    + Create Class
                  </button>
                </div>
              </div>

              {classesStatus.state === "loading" ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                </div>
              ) : null}
              {classesStatus.state === "error" ? (
                <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {classesStatus.message}
                </div>
              ) : null}

              {/* ── List view ── */}
              {classViewMode === "list" && (
                <div className="mt-6 grid gap-4">
                  {filteredClasses.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-6 text-sm text-slate-400">
                      No classes found.
                    </div>
                  ) : filteredClasses.map((item) => {
                    const isCancelled = item.status === "cancelled";
                    const isExpired = !isCancelled && new Date(item.endTime) < new Date();
                    const isInactive = isCancelled || isExpired;
                    const fillPercent = Math.round((item.booked / item.capacity) * 100);
                    return (
                      <div
                        key={item.id}
                        className={`group flex flex-col gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-center sm:justify-between ${
                          isInactive
                            ? "border-white/5 bg-white/[0.01] opacity-50"
                            : "border-white/5 bg-white/[0.02] hover:border-purple-500/30 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {!isInactive && (
                            <input
                              type="checkbox"
                              checked={selectedClassIds.has(item.id)}
                              onChange={() => toggleClassSelection(item.id)}
                              className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 accent-purple-500"
                            />
                          )}
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                            isInactive
                              ? "bg-slate-500/20"
                              : "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20"
                          }`}>
                            <svg className={`h-6 w-6 ${isInactive ? "text-slate-400" : "text-purple-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-purple-300 transition">
                              {item.title}
                              {isCancelled ? (
                                <span className="ml-2 rounded bg-rose-500/20 px-2 py-0.5 text-xs font-normal text-rose-400">Cancelled</span>
                              ) : isExpired ? (
                                <span className="ml-2 rounded bg-slate-500/20 px-2 py-0.5 text-xs font-normal text-slate-400">Expired</span>
                              ) : null}
                            </h3>
                            <p className="text-sm text-slate-400" suppressHydrationWarning>
                              {formatDateRange(item.startTime, item.endTime)}
                            </p>
                            {item.location && (
                              <p className="text-xs text-emerald-400/70">📍 {item.location}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">{item.booked}/{item.capacity}</p>
                            <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full ${fillPercent >= 100 ? "bg-rose-500" : fillPercent >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(fillPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                          <button
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-purple-500/50 hover:text-white"
                            type="button"
                            onClick={() => handleOpenAttendees(item)}
                          >
                            Attendees
                          </button>
                          {!isInactive ? (
                            <>
                              <button
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-purple-500/50 hover:text-white"
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleOpenEdit(item);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/20"
                                type="button"
                                onClick={() => handleOpenCancelConfirm(item)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Week / Month calendar view ── */}
              {(classViewMode === "week" || classViewMode === "month") && (
                <div className="mt-6">
                  {/* Calendar navigation */}
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={navigateCalPrev}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-purple-500/40 hover:text-white"
                    >
                      ‹
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white" suppressHydrationWarning>
                        {classViewMode === "week"
                          ? formatWeekRange(calWeekDates)
                          : formatMonthYear(calendarDate)}
                      </span>
                      <button
                        type="button"
                        onClick={goToNextClass}
                        disabled={!nextUpcomingClass}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 transition enabled:hover:border-purple-500/40 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next Class
                      </button>
                      <button
                        type="button"
                        onClick={goToCalToday}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-purple-500/40 hover:text-white"
                      >
                        Today
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={navigateCalNext}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-purple-500/40 hover:text-white"
                    >
                      ›
                    </button>
                  </div>

                  {/* Day-of-week headers */}
                  <div className="mb-2 grid grid-cols-7 gap-1 text-center">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <div key={d} className="py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Week view: one row of 7 columns */}
                  {classViewMode === "week" && (
                    <div className="grid grid-cols-7 gap-1">
                      {calWeekDates.map((date) => {
                        const dayClasses = getClassesForDay(date);
                        const isToday = isSameDay(date, today);
                        return (
                          <div
                            key={date.toISOString()}
                            className={`min-h-[120px] rounded-xl border p-2 ${
                              isToday ? "border-purple-500/40 bg-purple-500/5" : "border-white/5 bg-white/[0.02]"
                            }`}
                          >
                            <div className={`mb-2 text-center text-xs font-bold ${isToday ? "text-purple-400" : "text-slate-400"}`}>
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dayClasses.map((item) => {
                                const isCancelled = item.status === "cancelled";
                                const isExpired = !isCancelled && new Date(item.endTime) < new Date();
                                const isInactive = isCancelled || isExpired;
                                const fillPercent = Math.round((item.booked / item.capacity) * 100);
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      if (!isInactive) {
                                        handleOpenEdit(item);
                                        return;
                                      }
                                      handleOpenAttendees(item);
                                    }}
                                    className={`w-full rounded-lg p-1.5 text-left transition ${
                                      isCancelled
                                        ? "bg-rose-500/10 text-rose-400 opacity-60"
                                        : isExpired
                                        ? "bg-slate-500/10 text-slate-400 opacity-60"
                                        : fillPercent >= 100
                                        ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                                        : fillPercent >= 80
                                        ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                                        : "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25"
                                    }`}
                                  >
                                    <p className="truncate text-[11px] font-semibold leading-tight">{item.title}</p>
                                    <p className="text-[10px] opacity-80" suppressHydrationWarning>{formatTime(item.startTime)}</p>
                                    {!isInactive && (
                                      <p className="text-[10px] opacity-70">{item.booked}/{item.capacity}</p>
                                    )}
                                  </button>
                                );
                              })}
                              {dayClasses.length === 0 && (
                                <p className="text-center text-[10px] text-slate-600 pt-2">—</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Month view: 6-week grid with day-click to show details */}
                  {classViewMode === "month" && (
                    <>
                      <div className="grid grid-cols-7 gap-1">
                        {calMonthDates.map((date) => {
                          const dayClasses = getClassesForDay(date);
                          const isToday = isSameDay(date, today);
                          const isSelected = isSameDay(date, selectedCalDate);
                          const isCurrentMonth = date.getMonth() === calendarDate.getMonth();
                          const scheduledCount = dayClasses.filter((c) => c.status === "scheduled" && new Date(c.endTime) >= today).length;
                          return (
                            <button
                              key={date.toISOString()}
                              type="button"
                              onClick={() => setSelectedCalDate(new Date(date))}
                              className={`relative min-h-[64px] rounded-xl border p-2 text-left transition ${
                                isSelected
                                  ? "border-purple-500/60 bg-purple-500/10"
                                  : isToday
                                  ? "border-purple-500/30 bg-purple-500/5"
                                  : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                              } ${!isCurrentMonth ? "opacity-30" : ""}`}
                            >
                              <span className={`text-xs font-bold ${isToday ? "text-purple-400" : isCurrentMonth ? "text-slate-300" : "text-slate-600"}`}>
                                {date.getDate()}
                              </span>
                              {dayClasses.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-0.5">
                                  {dayClasses.slice(0, 3).map((c) => {
                                    const inactive = c.status === "cancelled" || new Date(c.endTime) < today;
                                    const full = (c.booked / c.capacity) >= 1;
                                    const nearly = (c.booked / c.capacity) >= 0.8;
                                    return (
                                      <span
                                        key={c.id}
                                        className={`h-1.5 w-1.5 rounded-full ${
                                          inactive ? "bg-slate-500" : full ? "bg-rose-400" : nearly ? "bg-amber-400" : "bg-purple-400"
                                        }`}
                                      />
                                    );
                                  })}
                                  {dayClasses.length > 3 && (
                                    <span className="text-[9px] text-slate-500">+{dayClasses.length - 3}</span>
                                  )}
                                </div>
                              )}
                              {scheduledCount > 0 && (
                                <span className="absolute bottom-1 right-2 text-[9px] text-slate-500">{scheduledCount}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected day detail panel */}
                      {(() => {
                        const dayClasses = getClassesForDay(selectedCalDate);
                        if (dayClasses.length === 0) return (
                          <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 text-sm text-slate-500">
                            No classes on {selectedCalDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}.
                          </div>
                        );
                        return (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1" suppressHydrationWarning>
                              {selectedCalDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                            </p>
                            {dayClasses.map((item) => {
                              const isCancelled = item.status === "cancelled";
                              const isExpired = !isCancelled && new Date(item.endTime) < new Date();
                              const isInactive = isCancelled || isExpired;
                              const fillPercent = Math.round((item.booked / item.capacity) * 100);
                              return (
                                <div
                                  key={item.id}
                                  className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                                    isInactive
                                      ? "border-white/5 bg-white/[0.01] opacity-60"
                                      : "border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40"
                                  }`}
                                >
                                  <div>
                                    <p className="font-semibold text-white">
                                      {item.title}
                                      {isCancelled && <span className="ml-2 rounded bg-rose-500/20 px-2 py-0.5 text-xs font-normal text-rose-400">Cancelled</span>}
                                      {isExpired && <span className="ml-2 rounded bg-slate-500/20 px-2 py-0.5 text-xs font-normal text-slate-400">Expired</span>}
                                    </p>
                                    <p className="text-sm text-slate-400" suppressHydrationWarning>
                                      {formatTime(item.startTime)} – {formatTime(item.endTime)}
                                    </p>
                                    {item.location && <p className="text-xs text-emerald-400/70">📍 {item.location}</p>}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-white">{item.booked}/{item.capacity}</p>
                                      <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                                        <div
                                          className={`h-full rounded-full ${fillPercent >= 100 ? "bg-rose-500" : fillPercent >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                                          style={{ width: `${Math.min(fillPercent, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                    <button type="button" onClick={() => handleOpenAttendees(item)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-purple-500/50 hover:text-white">
                                      Attendees
                                    </button>
                                    {!isInactive && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            handleOpenEdit(item);
                                          }}
                                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-purple-500/50 hover:text-white"
                                        >
                                          Edit
                                        </button>
                                        <button type="button" onClick={() => handleOpenCancelConfirm(item)} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/20">
                                          Cancel
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <section className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Customers ({customers.length})
              </h2>
              <button
                className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                type="button"
                onClick={() => setModal({ type: "createCustomer" })}
              >
                + Add Customer
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search customers by name, email, or village..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="input-dark w-full h-12 rounded-xl px-4 text-sm"
              />
            </div>

            {customersStatus.state === "loading" ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              </div>
            ) : customersStatus.state === "error" ? (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {customersStatus.message}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
                <p className="text-slate-400">
                  {customerSearch ? "No customers found" : "No customers yet"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="group flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-purple-500/30 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-slate-400">{customer.email}</p>
                      {customer.retirementVillage && (
                        <p className="text-xs text-slate-500 mt-1">{customer.retirementVillage}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span>{customer.sessionPassRemaining}/{customer.sessionPassTotal} sessions</span>
                        {customer._count && (
                          <span>· {customer._count.bookings} bookings</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-purple-500/50 hover:text-white"
                        type="button"
                        onClick={() => setModal({ type: "editCustomer", customer })}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/20"
                        type="button"
                        onClick={() => setModal({ type: "deleteCustomerConfirm", customer })}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Villages Tab */}
        {activeTab === "villages" && (
          <section className="glass-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Villages</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Villages</h3>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  {/* Add Village Form */}
                  <form onSubmit={handleAddVillage} className="mb-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Enter village name..."
                        value={newVillageName}
                        onChange={(e) => setNewVillageName(e.target.value)}
                        className="input-dark flex-1 h-10 rounded-xl px-4 text-sm"
                      />
                      <button
                        type="submit"
                        className="btn-glow rounded-xl px-5 py-2 text-sm font-semibold text-white whitespace-nowrap"
                      >
                        + Add Village
                      </button>
                    </div>
                  </form>

                  {/* Villages List */}
                  {villagesStatus.state === "loading" ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                    </div>
                  ) : villagesStatus.state === "error" ? (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                      {villagesStatus.message}
                    </div>
                  ) : villages.length === 0 ? (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
                      <p className="text-sm text-slate-400">No villages yet. Add one above.</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {villages.map((village) => (
                        <li key={village.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 group hover:border-purple-500/30 hover:bg-white/[0.04] transition">
                          <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-slate-300 group-hover:text-white transition">{village.name}</span>
                          </div>
                          <button
                            onClick={() => setModal({ type: "deleteVillageConfirm", village })}
                            className="opacity-0 group-hover:opacity-100 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/20"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="mt-4 text-xs text-slate-400">
                    Villages can be added or removed dynamically. Changes will be reflected in customer and class forms.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Admin Access</h3>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300 mb-2">
                    Current password: <code className="rounded bg-white/5 px-2 py-1 font-mono text-xs">admin123</code>
                  </p>
                  <p className="text-xs text-slate-400">
                    To change the admin password, update the ADMIN_PASSWORD environment variable in Vercel.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modals - continued in next part... */}
      {/* Modal overlay */}
      {modal.type !== "none" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card w-full max-w-2xl rounded-3xl p-6 shadow-2xl my-8">
            {/* Create Class Modal */}
            {modal.type === "create" ? (
              <>
                <h2 className="text-lg font-semibold text-white">Create Class</h2>
                <form className="mt-4 grid gap-4" onSubmit={handleCreateSubmit}>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Title
                    <input
                      name="title"
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Start time
                    <input
                      name="startTime"
                      type="datetime-local"
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    End time
                    <input
                      name="endTime"
                      type="datetime-local"
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Capacity
                    <input
                      name="capacity"
                      type="number"
                      min={1}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Location
                    <select
                      name="location"
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                    >
                      <option value="">Select location...</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="h-5 w-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-slate-300">Make this a recurring class</span>
                    </label>
                    {isRecurring && (
                      <div className="mt-4">
                        <label className="grid gap-2 text-sm font-medium text-slate-300">
                          Repeat weekly for
                          <select
                            name="repeatWeeks"
                            className="input-dark h-12 rounded-xl px-4 text-sm"
                            defaultValue="8"
                          >
                            <option value="4">4 weeks</option>
                            <option value="8">8 weeks</option>
                            <option value="12">12 weeks</option>
                            <option value="26">26 weeks (6 months)</option>
                            <option value="52">52 weeks (1 year)</option>
                          </select>
                        </label>
                        <p className="mt-2 text-xs text-slate-400">
                          This will create multiple class entries, one for each week.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </>
            ) : null}

            {/* Edit Class Modal */}
            {modal.type === "edit" ? (
              <>
                <h2 className="text-lg font-semibold text-white">Edit Class</h2>
                <form className="mt-4 grid gap-4" onSubmit={handleEditSubmit}>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Title
                    <input
                      name="title"
                      defaultValue={modal.classItem.title}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Start time
                    <input
                      name="startTime"
                      type="datetime-local"
                      defaultValue={toDatetimeLocal(modal.classItem.startTime)}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    End time
                    <input
                      name="endTime"
                      type="datetime-local"
                      defaultValue={toDatetimeLocal(modal.classItem.endTime)}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Capacity
                    <input
                      name="capacity"
                      type="number"
                      min={1}
                      defaultValue={modal.classItem.capacity}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Location
                    <select
                      name="location"
                      defaultValue={modal.classItem.location || ""}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                    >
                      <option value="">Select location...</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {modal.classItem.recurringGroupId && (
                    <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applyToSeries}
                          onChange={(e) => setApplyToSeries(e.target.checked)}
                          className="h-5 w-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-slate-300">Apply changes to all future classes in this series</span>
                      </label>
                    </div>
                  )}
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </>
            ) : null}

            {/* Attendees Modal */}
            {modal.type === "attendees" ? (
              <>
                <h2 className="text-lg font-semibold text-white">
                  Attendees – {modal.classItem.title}
                </h2>
                {modal.attendees.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
                    <p className="text-sm text-slate-400">No attendees yet.</p>
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-white/5">
                    {modal.attendees.map((a, idx) => (
                      <li key={a.id} className="py-3 flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-white">{a.customerName}</p>
                          <p className="text-sm text-slate-400">{a.customerEmail}</p>
                        </div>
                        <button
                          className={`rounded-full px-3 py-1 text-xs font-medium transition focus:outline-none ${
                            a.attendanceStatus === "attended"
                              ? "bg-emerald-500/80 text-white hover:bg-emerald-600"
                              : "bg-slate-600/40 text-slate-200 hover:bg-slate-500"
                          }`}
                          onClick={async () => {
                            const newStatus = a.attendanceStatus === "attended" ? "absent" : "attended";
                            try {
                              const res = await fetch(`/api/classes/${modal.classItem.id}/attendees`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ attendeeId: a.id, attendanceStatus: newStatus }),
                              });
                              if (!res.ok) throw new Error("Failed to update attendance");
                              setModal((prev) => prev.type === "attendees" ? {
                                ...prev,
                                attendees: prev.attendees.map((att, i) =>
                                  i === idx ? { ...att, attendanceStatus: newStatus } : att
                                ),
                              } : prev);
                              toast.success(`Marked as ${newStatus}`);
                            } catch {
                              toast.error("Could not update attendance");
                            }
                          }}
                        >
                          {a.attendanceStatus === "attended" ? "Attended" : "Mark Attended"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}

            {/* Cancel Class Confirm Modal */}
            {modal.type === "cancelConfirm" ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                    <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-rose-400">
                    Cancel Class?
                  </h2>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  This will cancel <strong className="text-white">{modal.classItem.title}</strong> and
                  notify all attendees. This action cannot be undone.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  {modal.classItem.recurringGroupId && (
                    <button
                      type="button"
                      className="w-full rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600"
                      onClick={() => handleCancelClass(true)}
                    >
                      Cancel all future in series
                    </button>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                      onClick={handleCloseModal}
                    >
                      Keep class
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600"
                      onClick={() => handleCancelClass(false)}
                    >
                      Cancel this class only
                    </button>
                  </div>
                </div>
              </>
            ) : null}

            {/* Bulk Cancel Confirm Modal */}
            {modal.type === "bulkCancelConfirm" ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                    <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-rose-400">
                    Cancel {modal.classIds.length} Classes?
                  </h2>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  This will cancel <strong className="text-white">{modal.classIds.length} selected classes</strong> and
                  notify all attendees. This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                    onClick={handleCloseModal}
                  >
                    Keep classes
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600"
                    onClick={handleBulkCancel}
                  >
                    Cancel {modal.classIds.length} classes
                  </button>
                </div>
              </>
            ) : null}

            {/* Create Customer Modal */}
            {modal.type === "createCustomer" ? (
              <>
                <h2 className="text-lg font-semibold text-white mb-4">Add Customer</h2>
                <form className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2" onSubmit={handleCreateCustomer}>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Name *
                    <input name="name" className="input-dark h-10 rounded-xl px-4 text-sm" required />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Email *
                    <input name="email" type="email" className="input-dark h-10 rounded-xl px-4 text-sm" required />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Password (default: changeme)
                    <input name="password" type="password" className="input-dark h-10 rounded-xl px-4 text-sm" placeholder="changeme" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Retirement Village
                    <select name="retirementVillage" className="input-dark h-10 rounded-xl px-4 text-sm">
                      <option value="">Select village...</option>
                      {villages.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Birthdate
                    <input name="birthdate" type="date" className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Phone
                    <input name="phone" type="tel" className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Address
                    <input name="address" className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Emergency Contact Name
                    <input name="emergencyContactName" className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Emergency Contact Phone
                    <input name="emergencyContactPhone" type="tel" className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="grid gap-2 text-sm font-medium text-slate-300">
                      Sessions Remaining
                      <input name="sessionPassRemaining" type="number" min="0" defaultValue="10" className="input-dark h-10 rounded-xl px-4 text-sm" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-slate-300">
                      Total Sessions
                      <input name="sessionPassTotal" type="number" min="1" defaultValue="10" className="input-dark h-10 rounded-xl px-4 text-sm" />
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button type="button" className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white">
                      Create
                    </button>
                  </div>
                </form>
              </>
            ) : null}

            {/* Edit Customer Modal */}
            {modal.type === "editCustomer" ? (
              <>
                <h2 className="text-lg font-semibold text-white mb-4">Edit Customer</h2>
                <form className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2" onSubmit={handleUpdateCustomer}>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Name *
                    <input name="name" defaultValue={modal.customer.name} className="input-dark h-10 rounded-xl px-4 text-sm" required />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Email *
                    <input name="email" type="email" defaultValue={modal.customer.email} className="input-dark h-10 rounded-xl px-4 text-sm" required />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Retirement Village
                    <select name="retirementVillage" defaultValue={modal.customer.retirementVillage || ""} className="input-dark h-10 rounded-xl px-4 text-sm">
                      <option value="">Select village...</option>
                      {villages.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Birthdate
                    <input name="birthdate" type="date" defaultValue={toDateInput(modal.customer.birthdate)} className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Phone
                    <input name="phone" type="tel" defaultValue={modal.customer.phone || ""} className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Address
                    <input name="address" defaultValue={modal.customer.address || ""} className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Emergency Contact Name
                    <input name="emergencyContactName" defaultValue={modal.customer.emergencyContactName || ""} className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Emergency Contact Phone
                    <input name="emergencyContactPhone" type="tel" defaultValue={modal.customer.emergencyContactPhone || ""} className="input-dark h-10 rounded-xl px-4 text-sm" />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="grid gap-2 text-sm font-medium text-slate-300">
                      Sessions Remaining
                      <input name="sessionPassRemaining" type="number" min="0" defaultValue={modal.customer.sessionPassRemaining} className="input-dark h-10 rounded-xl px-4 text-sm" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-slate-300">
                      Total Sessions
                      <input name="sessionPassTotal" type="number" min="1" defaultValue={modal.customer.sessionPassTotal} className="input-dark h-10 rounded-xl px-4 text-sm" />
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button type="button" className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white">
                      Save
                    </button>
                  </div>
                </form>
              </>
            ) : null}

            {/* Delete Customer Confirm Modal */}
            {modal.type === "deleteCustomerConfirm" ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                    <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-rose-400">Delete Customer?</h2>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  This will permanently delete <strong className="text-white">{modal.customer.name}</strong> and all their bookings. This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="button" className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600" onClick={handleDeleteCustomer}>
                    Delete Customer
                  </button>
                </div>
              </>
            ) : null}

            {/* Delete Village Confirm Modal */}
            {modal.type === "deleteVillageConfirm" ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                    <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-rose-400">Delete Village?</h2>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  Are you sure you want to delete <strong className="text-white">{modal.village.name}</strong>? This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="button" className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600" onClick={handleDeleteVillage}>
                    Delete Village
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
