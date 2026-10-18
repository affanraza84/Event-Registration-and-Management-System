"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import Image from "next/image";
import {
  Calendar,
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  Download,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit3,
} from "lucide-react";
import { closeEventAction, deleteEventAction, updateEventAction } from "@/actions/events";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import { getEventCover } from "@/lib/eventCovers";

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
  description?: string;
  sourceUrl?: string;
  imageUrl?: string;
  imagePublicId?: string;
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
  session: {
    user: {
      name?: string | null;
      email?: string | null;
      id?: string | null;
      role?: string | null;
    };
  };
}

const columnHelper = createColumnHelper<RegistrationItem>();

export default function DashboardClient({
  initialAnalytics,
  initialEvents,
  initialRegistrations,
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

  // Edit Event Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    capacity: 50,
    registrationDeadline: "",
    sourceUrl: "",
    imageUrl: "",
    imagePublicId: "",
  });
  const [isUploadingEditPoster, setIsUploadingEditPoster] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Sorting state for TanStack Table
  const [sorting, setSorting] = useState<SortingState>([]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        reg.attendeeName.toLowerCase().includes(query) ||
        reg.attendeeEmail.toLowerCase().includes(query);

      const matchesEvent = !selectedEventId || reg.eventId === selectedEventId;
      const matchesDate = !filterDate || reg.registeredAt.startsWith(filterDate);

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
        setEvents((prev) =>
          prev.map((e) =>
            e.id === selectedEvent.id ? { ...e, isClosed: true } : e
          )
        );
        setCloseConfirmOpen(false);
        setSelectedEvent(null);
        router.refresh();
      }
    } catch {
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
    } catch {
      setActionError("Failed to delete the event. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Event Edit handlers
  const handleOpenEditModal = (event: EventItem) => {
    setEventToEdit(event);
    setEditForm({
      title: event.title,
      description: event.description || "",
      date: event.date ? event.date.split("T")[0] : "",
      time: event.time || "",
      location: event.location,
      capacity: event.capacity,
      registrationDeadline: event.registrationDeadline
        ? event.registrationDeadline.split("T")[0]
        : "",
      sourceUrl: event.sourceUrl || "",
      imageUrl: event.imageUrl || "",
      imagePublicId: event.imagePublicId || "",
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventToEdit) return;

    setIsProcessing(true);
    setEditError(null);

    try {
      const result = await updateEventAction(eventToEdit.id, editForm);
      if (result.error) {
        setEditError(result.error);
      } else {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventToEdit.id
              ? {
                  ...ev,
                  title: editForm.title,
                  description: editForm.description,
                  date: new Date(editForm.date).toISOString(),
                  time: editForm.time,
                  location: editForm.location,
                  capacity: editForm.capacity,
                  registrationDeadline: new Date(
                    editForm.registrationDeadline
                  ).toISOString(),
                  sourceUrl: editForm.sourceUrl,
                  imageUrl: editForm.imageUrl || undefined,
                  imagePublicId: editForm.imagePublicId || undefined,
                }
              : ev
          )
        );
        setEditModalOpen(false);
        setEventToEdit(null);
        router.refresh();
      }
    } catch {
      setEditError("Failed to update event. Please try again.");
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

  const columns = useMemo(
    () => [
      columnHelper.accessor("attendeeName", {
        header: "Attendee Name",
        cell: (info) => (
          <span className="font-semibold text-[#171923]">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("attendeeEmail", {
        header: "Email Address",
        cell: (info) => (
          <span className="text-[#686D78] font-mono text-xs">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("eventTitle", {
        header: "Event",
        cell: (info) => (
          <span className="px-2.5 py-1 bg-[#FAF9F6] border border-[#E8E5DF] rounded-lg text-xs font-medium text-[#171923] inline-block max-w-[220px] truncate">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("registeredAt", {
        header: "Registered On",
        cell: (info) => (
          <span className="text-[#686D78] text-xs">
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-10 animate-fade-in">
        {/* Top Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8E5DF]">
          <div>
            <span className="text-xs font-semibold text-[#5146E5] uppercase tracking-wider">
              Host Operations
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#171923] mt-1">
              Host Workspace & Analytics
            </h1>
            <p className="text-[#686D78] mt-1 text-sm">
              Monitor active gatherings, attendee volumes, and registrations in real-time.
            </p>
          </div>
          <Link
            href="/events/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5146E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-xl shadow-xs transition-all active:scale-[0.99] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        </div>

        {/* Compact Metrics Row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#686D78] uppercase tracking-wider">
                Total Events
              </span>
              <div className="text-3xl font-bold text-[#171923]">
                {analytics.totalEvents}
              </div>
            </div>
            <div className="p-3 bg-[#EEEAFE] rounded-xl text-[#5146E5]">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#686D78] uppercase tracking-wider">
                Total Registrations
              </span>
              <div className="text-3xl font-bold text-[#171923]">
                {analytics.totalAttendees}
              </div>
            </div>
            <div className="p-3 bg-[#EEEAFE] rounded-xl text-[#5146E5]">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#686D78] uppercase tracking-wider">
                Upcoming Gatherings
              </span>
              <div className="text-3xl font-bold text-[#171923]">
                {analytics.upcomingEvents}
              </div>
            </div>
            <div className="p-3 bg-[#ECFDF5] rounded-xl text-[#059669]">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Event Directory Section */}
        <section className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#171923]">
              Hosted Events Directory
            </h2>
            <span className="text-xs text-[#686D78]">
              {events.length} active or concluded
            </span>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#E8E5DF] rounded-xl space-y-3">
              <p className="text-[#686D78] text-sm">
                No events published yet.
              </p>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-1.5 text-[#5146E5] hover:text-[#4338CA] font-semibold text-sm transition-colors"
              >
                <span>Create your first gathering</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E5DF] text-[#686D78] text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Event Title</th>
                    <th className="pb-3 px-4">Date & Time</th>
                    <th className="pb-3 px-4">RSVP Count</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E5DF]">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-4 pr-4 font-semibold text-[#171923]">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-9 rounded-lg overflow-hidden border border-[#E8E5DF] shrink-0 bg-[#FAF9F6]">
                            <Image
                              src={ev.imageUrl || getEventCover(ev.title, undefined, ev.id).url}
                              alt={ev.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/events/${ev.slug}`}
                              className="hover:text-[#5146E5] transition-colors inline-flex items-center gap-1.5"
                            >
                              <span className="truncate">{ev.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                            </Link>
                            <div className="text-[11px] text-[#686D78] font-normal truncate max-w-xs">
                              {ev.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#686D78] text-xs">
                        <div className="font-medium text-[#171923]">
                          {new Date(ev.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div>{ev.time}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#686D78]">
                        <span className="font-bold text-[#171923]">
                          {ev.attendeeCount}
                        </span>{" "}
                        / {ev.capacity} spots
                      </td>
                      <td className="py-4 px-4">
                        {ev.isClosed ? (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#FAF9F6] border border-[#E8E5DF] text-[#686D78] rounded-full">
                            Closed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 pl-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(ev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] hover:border-[#D5D1C8] text-xs font-semibold rounded-lg text-[#171923] transition-all shadow-2xs cursor-pointer"
                          title="Edit Event & Poster"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#5146E5]" />
                          <span>Edit</span>
                        </button>

                        <a
                          href={`/api/events/${ev.id}/export`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] hover:border-[#D5D1C8] text-xs font-semibold rounded-lg text-[#171923] transition-all shadow-2xs"
                          title="Export attendees as CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </a>

                        {!ev.isClosed && (
                          <button
                            onClick={() => handleOpenCloseModal(ev)}
                            className="px-2.5 py-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-xs font-semibold text-[#D97706] rounded-lg transition-all cursor-pointer"
                          >
                            Close RSVP
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDeleteModal(ev)}
                          className="p-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] rounded-lg transition-all cursor-pointer"
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

        {/* Attendee / Registration Directory Section */}
        <section className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#171923]">
                Attendee Registry
              </h2>
              <p className="text-xs text-[#686D78] mt-0.5">
                Search, filter, and audit attendee lists with secure CSV export.
              </p>
            </div>
            {filteredRegistrations.length > 0 && (
              <button
                onClick={handleClientExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#5146E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Filtered to CSV</span>
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#686D78] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white text-sm text-[#171923] placeholder-[#9CA3AF] rounded-xl focus:outline-none transition-all"
              />
            </div>

            {/* Event Dropdown Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 text-[#686D78] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white text-sm text-[#171923] rounded-xl focus:outline-none transition-all cursor-pointer appearance-none"
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
              <Calendar className="w-4 h-4 text-[#686D78] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-[#E8E5DF] focus:border-[#5146E5] focus:bg-white text-sm text-[#171923] rounded-xl focus:outline-none transition-all cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#686D78] hover:text-[#171923] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* TanStack Table Rendering */}
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#E8E5DF] rounded-xl text-[#686D78] text-sm">
              No registrations found matching the current search criteria.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="border-b border-[#E8E5DF] text-[#686D78] text-xs font-semibold uppercase tracking-wider"
                      >
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="pb-3 py-2 cursor-pointer select-none hover:text-[#171923] transition-colors"
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
                  <tbody className="divide-y divide-[#E8E5DF]">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-[#FAF9F6] transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-3.5">
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

              {/* Table Pagination */}
              <div className="flex items-center justify-between border-t border-[#E8E5DF] pt-4 text-xs text-[#686D78]">
                <div>
                  Showing {table.getRowModel().rows.length} of{" "}
                  {filteredRegistrations.length} registrations
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1.5 border border-[#E8E5DF] hover:border-[#D5D1C8] bg-white rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#171923]" />
                  </button>
                  <span>
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-1.5 border border-[#E8E5DF] hover:border-[#D5D1C8] bg-white rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <ChevronRight className="w-4 h-4 text-[#171923]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Edit Event Modal */}
      {editModalOpen && eventToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171923]/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white border border-[#E8E5DF] rounded-2xl max-w-xl w-full p-6 shadow-[0_20px_50px_rgba(23,25,35,0.15)] relative space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DF]">
              <div>
                <h3 className="text-base font-bold text-[#171923]">
                  Edit Event & Poster
                </h3>
                <p className="text-xs text-[#686D78]">
                  Update event details and manage Cloudinary cover poster
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={isProcessing || isUploadingEditPoster}
                className="p-1 text-[#686D78] hover:text-[#171923] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4">
              {/* Image Upload Component */}
              <ImageUpload
                value={editForm.imageUrl}
                publicId={editForm.imagePublicId}
                onChange={(url, publicId) => {
                  setEditForm((prev) => ({
                    ...prev,
                    imageUrl: url,
                    imagePublicId: publicId,
                  }));
                }}
                onRemove={() => {
                  setEditForm((prev) => ({
                    ...prev,
                    imageUrl: "",
                    imagePublicId: "",
                  }));
                }}
                onUploadStateChange={setIsUploadingEditPoster}
                disabled={isProcessing}
                eventId={eventToEdit.id}
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white focus:border-[#5146E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white focus:border-[#5146E5] resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white focus:border-[#5146E5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                    Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM - 4:00 PM"
                    value={editForm.time}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, time: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white focus:border-[#5146E5]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                  Location / Venue
                </label>
                <input
                  type="text"
                  required
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white focus:border-[#5146E5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.capacity}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        capacity: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white focus:border-[#5146E5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                    RSVP Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.registrationDeadline}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        registrationDeadline: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-sm text-[#171923] focus:outline-none focus:bg-white focus:border-[#5146E5]"
                  />
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-xs font-medium">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E5DF]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={isProcessing || isUploadingEditPoster}
                  className="px-4 py-2 border border-[#E8E5DF] hover:border-[#D5D1C8] bg-white text-[#171923] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || isUploadingEditPoster}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#5146E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : isUploadingEditPoster ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Poster...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Event Modal */}
      {closeConfirmOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171923]/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E8E5DF] rounded-2xl max-w-md w-full p-6 shadow-[0_20px_50px_rgba(23,25,35,0.15)] relative space-y-4">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-[#FFFBEB] rounded-xl text-[#D97706] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#171923]">
                  Close Registration
                </h3>
                <p className="text-xs text-[#686D78]">
                  Prevent new registrations for this event
                </p>
              </div>
            </div>
            <p className="text-sm text-[#686D78] leading-relaxed">
              Are you sure you want to close registrations for{" "}
              <strong className="text-[#171923]">{selectedEvent.title}</strong>? No new attendees will be able to register.
            </p>

            {actionError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-xs font-medium">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCloseConfirmOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 border border-[#E8E5DF] hover:border-[#D5D1C8] bg-white text-[#171923] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseEvent}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Closing...</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171923]/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E8E5DF] rounded-2xl max-w-md w-full p-6 shadow-[0_20px_50px_rgba(23,25,35,0.15)] relative space-y-4">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-[#FEE2E2] rounded-xl text-[#DC2626] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#171923]">
                  Delete Event
                </h3>
                <p className="text-xs text-[#686D78]">
                  Irreversible destructive action
                </p>
              </div>
            </div>
            <p className="text-sm text-[#686D78] leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#171923]">{selectedEvent.title}</strong>?
              This will remove the event and{" "}
              <strong className="text-[#DC2626]">
                cascade-delete all {selectedEvent.attendeeCount} registrations
              </strong>
              . This action cannot be undone.
            </p>

            {actionError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-xs font-medium">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 border border-[#E8E5DF] hover:border-[#D5D1C8] bg-white text-[#171923] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
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
