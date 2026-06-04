"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import {
  Calendar,
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Lock,
  Loader2,
  X,
  AlertTriangle,
  Download,
  Shield,
  LogOut,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { closeEventAction, deleteEventAction } from "@/actions/events";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  attendeeCount: number;
  registrationDeadline: string;
  isClosed: boolean;
}

interface RegistrationItem {
  id: string;
  registeredAt: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  eventId: string;
}

interface DashboardClientProps {
  initialAnalytics: {
    totalEvents: number;
    totalAttendees: number;
    upcomingEvents: number;
  };
  initialEvents: EventItem[];
  initialRegistrations: RegistrationItem[];
  session: any;
}

export default function DashboardClient({
  initialAnalytics,
  initialEvents,
  initialRegistrations,
  session,
}: DashboardClientProps) {
  const router = useRouter();

  // Local state
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [registrations, setRegistrations] =
    useState<RegistrationItem[]>(initialRegistrations);
  const [analytics, setAnalytics] = useState(initialAnalytics);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Modal dialog states
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sorting state for TanStack Table
  const [sorting, setSorting] = useState<SortingState>([]);

  // Filtered registrations based on search & filters
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        reg.attendeeName.toLowerCase().includes(query) ||
        reg.attendeeEmail.toLowerCase().includes(query);

      // 2. Event Filter
      const matchesEvent = !selectedEventId || reg.eventId === selectedEventId;

      // 3. Date Filter
      const matchesDate =
        !filterDate || reg.registeredAt.startsWith(filterDate);

      return matchesSearch && matchesEvent && matchesDate;
    });
  }, [registrations, searchQuery, selectedEventId, filterDate]);

  // Event Close handler
  const handleOpenCloseModal = (event: EventItem) => {
    setSelectedEvent(event);
    setCloseConfirmOpen(true);
    setActionError(null);
  };

  const handleCloseEvent = async () => {
    if (!selectedEvent) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const result = await closeEventAction(selectedEvent.id);

      if (result.error) {
        setActionError(result.error);
      } else {
        // Update local state
        setEvents((prev) =>
          prev.map((e) => (e.id === selectedEvent.id ? { ...e, isClosed: true } : e))
        );
        setCloseConfirmOpen(false);
        setSelectedEvent(null);
        router.refresh();
      }
    } catch (err) {
      setActionError("Failed to close the event. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Event Delete handler
  const handleOpenDeleteModal = (event: EventItem) => {
    setSelectedEvent(event);
    setDeleteConfirmOpen(true);
    setActionError(null);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const result = await deleteEventAction(selectedEvent.id);

      if (result.error) {
        setActionError(result.error);
      } else {
        // Update local states (events, registrations, analytics)
        setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
        setRegistrations((prev) =>
          prev.filter((r) => r.eventId !== selectedEvent.id)
        );
        setAnalytics((prev) => ({
          ...prev,
          totalEvents: Math.max(prev.totalEvents - 1, 0),
          totalAttendees: Math.max(
            prev.totalAttendees - selectedEvent.attendeeCount,
            0
          ),
          upcomingEvents:
            new Date(selectedEvent.date) > new Date()
              ? Math.max(prev.upcomingEvents - 1, 0)
              : prev.upcomingEvents,
        }));
        setDeleteConfirmOpen(false);
        setSelectedEvent(null);
        router.refresh();
      }
    } catch (err) {
      setActionError("Failed to delete the event. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Client-Side CSV Export of Filtered Registrations Table
  const handleClientExportCSV = () => {
    if (filteredRegistrations.length === 0) return;

    const headers = "Name,Email,Event,Registration Date\n";
    const rows = filteredRegistrations
      .map((reg) => {
        const escapedName = reg.attendeeName.replace(/"/g, '""');
        const escapedEmail = reg.attendeeEmail.replace(/"/g, '""');
        const escapedTitle = reg.eventTitle.replace(/"/g, '""');
        const formattedDate = reg.registeredAt.split("T")[0];
        return `"${escapedName}","${escapedEmail}","${escapedTitle}","${formattedDate}"`;
      })
      .join("\n");

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "filtered-attendees.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TanStack Table columns helper
  const columnHelper = createColumnHelper<RegistrationItem>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("attendeeName", {
        header: "Attendee Name",
        cell: (info) => (
          <span className="font-semibold text-neutral-200">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("attendeeEmail", {
        header: "Email Address",
        cell: (info) => (
          <span className="text-neutral-450">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("eventTitle", {
        header: "Event",
        cell: (info) => (
          <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("registeredAt", {
        header: "Registered On",
        cell: (info) => (
          <span className="text-neutral-500">
            {new Date(info.getValue()).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      }),
    ],
    []
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: filteredRegistrations,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-neutral-900 bg-neutral-900/20 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
          >
            Luma Dashboard
          </Link>
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-900/60 rounded-full flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Host
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-350 hidden sm:inline">
            Welcome, <strong>{session.user.name}</strong> ({session.user.email})
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-sm font-medium rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full z-10 space-y-10">
        {/* Top Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              Host Panel
            </h1>
            <p className="text-neutral-400 mt-1.5 text-sm">
              Overview of your hosted events, registrations, and analytics.
            </p>
          </div>
          <Link
            href="/events/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-950/20"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </div>

        {/* Analytics Section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 flex items-center justify-between hover:border-neutral-700/80 transition-all">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-450 uppercase tracking-wider">
                Total Events
              </span>
              <h3 className="text-3xl font-extrabold text-neutral-100">
                {analytics.totalEvents}
              </h3>
            </div>
            <div className="p-3 bg-purple-950/40 border border-purple-900/40 rounded-xl text-purple-400">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 flex items-center justify-between hover:border-neutral-700/80 transition-all">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-450 uppercase tracking-wider">
                Total Attendees
              </span>
              <h3 className="text-3xl font-extrabold text-neutral-100">
                {analytics.totalAttendees}
              </h3>
            </div>
            <div className="p-3 bg-indigo-950/40 border border-indigo-900/40 rounded-xl text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 flex items-center justify-between hover:border-neutral-700/80 transition-all">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-450 uppercase tracking-wider">
                Upcoming Events
              </span>
              <h3 className="text-3xl font-extrabold text-neutral-100">
                {analytics.upcomingEvents}
              </h3>
            </div>
            <div className="p-3 bg-amber-950/40 border border-amber-900/40 rounded-xl text-amber-400">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Events Table Section */}
        <section className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-neutral-200">Event Directory</h2>

          {events.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl space-y-4">
              <p className="text-neutral-500 text-sm">
                No events created yet.
              </p>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-semibold text-sm transition-colors"
              >
                Create your first event <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800/80 text-neutral-400 font-semibold">
                    <th className="pb-3 pr-4">Event Title</th>
                    <th className="pb-3 px-4">Date & Time</th>
                    <th className="pb-3 px-4">RSVPs</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {events.map((ev) => (
                    <tr key={ev.id} className="group">
                      <td className="py-4 pr-4 font-semibold text-neutral-250">
                        <Link
                          href={`/events/${ev.slug}`}
                          className="hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
                        >
                          {ev.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-neutral-400">
                        <div>
                          {new Date(ev.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-neutral-500">{ev.time}</div>
                      </td>
                      <td className="py-4 px-4 text-neutral-400">
                        <span className="font-semibold text-neutral-200">
                          {ev.attendeeCount}
                        </span>{" "}
                        / {ev.capacity}
                      </td>
                      <td className="py-4 px-4">
                        {ev.isClosed ? (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-full">
                            Closed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-950/40 border border-purple-900/40 text-purple-300 rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 pl-4 text-right space-x-2">
                        {/* Server-Side CSV Export for specific event */}
                        <a
                          href={`/api/events/${ev.id}/export`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-semibold rounded-lg text-neutral-400 hover:text-neutral-200 transition-all"
                          title="Export attendees as CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                          CSV
                        </a>

                        {!ev.isClosed && (
                          <button
                            onClick={() => handleOpenCloseModal(ev)}
                            className="px-2.5 py-1.5 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/40 hover:border-amber-900/60 text-xs font-semibold text-amber-400 rounded-lg transition-all cursor-pointer"
                          >
                            Close
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDeleteModal(ev)}
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 hover:border-red-900/60 text-red-400 rounded-lg transition-all cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Attendee / Registration Management Section */}
        <section className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-neutral-200">
              RSVP Management
            </h2>
            {/* Table-wide Export */}
            {filteredRegistrations.length > 0 && (
              <button
                onClick={handleClientExportCSV}
                className="w-fit flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Filtered to CSV
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by Name or Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-950/50 border border-neutral-800 focus:border-purple-500/80 text-sm text-neutral-100 placeholder-neutral-500 rounded-xl focus:outline-none transition-all"
              />
            </div>

            {/* Event dropdown Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Filter className="w-4 h-4" />
              </div>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-950/50 border border-neutral-800 focus:border-purple-500/80 text-sm text-neutral-300 rounded-xl focus:outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="">All Events</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-950/50 border border-neutral-800 focus:border-purple-500/80 text-sm text-neutral-300 rounded-xl focus:outline-none transition-all cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* TanStack Table Rendering */}
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-sm">
              No attendees found matching current filters.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="border-b border-neutral-800/80 text-neutral-450 font-semibold"
                      >
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="pb-3 py-2 cursor-pointer select-none hover:text-neutral-200 transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: " ▴",
                                desc: " ▾",
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Controls */}
              <div className="flex items-center justify-between border-t border-neutral-900 pt-4 text-xs text-neutral-400">
                <div>
                  Showing {table.getRowModel().rows.length} of{" "}
                  {filteredRegistrations.length} registrations
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1.5 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-1.5 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Close Event Modal */}
      {closeConfirmOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
            onClick={() => setCloseConfirmOpen(false)}
          />
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative z-10 space-y-4">
            <div className="flex items-start gap-2.5 text-amber-500">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <h3 className="text-lg font-bold text-neutral-100">
                Close Registration
              </h3>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Are you sure you want to close registration for{" "}
              <strong>{selectedEvent.title}</strong>? No new attendees will be
              able to register. This action is irreversible.
            </p>

            {actionError && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-medium">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCloseConfirmOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-350 text-sm font-medium rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseEvent}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Closing...
                  </>
                ) : (
                  "Close RSVP"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      {deleteConfirmOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative z-10 space-y-4">
            <div className="flex items-start gap-2.5 text-red-500">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <h3 className="text-lg font-bold text-neutral-100">
                Delete Event
              </h3>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Are you sure you want to delete <strong>{selectedEvent.title}</strong>?
              This will permanently delete the event and{" "}
              <strong>cascade-delete all {selectedEvent.attendeeCount} registrations</strong>.
              This action cannot be undone.
            </p>

            {actionError && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-medium">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-355 text-sm font-medium rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-650 hover:bg-red-650/90 text-white text-sm font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Event"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
