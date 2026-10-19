"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
} from "lucide-react";

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  onBlur?: () => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
  name?: string;
  className?: string;
  allowClear?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(dateStr?: string): { year: number; month: number; day: number } | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

function formatDateISO(year: number, monthIndex: number, day: number): string {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "";
  const parsed = parseDate(dateStr);
  if (!parsed) return dateStr;
  const date = new Date(parsed.year, parsed.month, parsed.day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DatePicker({
  value = "",
  onChange,
  onBlur,
  minDate,
  maxDate,
  placeholder = "Select date...",
  disabled = false,
  hasError = false,
  id,
  name,
  className = "",
  allowClear = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months">("days");

  const parsedValue = useMemo(() => parseDate(value), [value]);
  const parsedMin = useMemo(() => parseDate(minDate), [minDate]);

  const today = useMemo(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      iso: formatDateISO(d.getFullYear(), d.getMonth(), d.getDate()),
    };
  }, []);

  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (parsedValue) return parsedValue.year;
    if (parsedMin) return parsedMin.year;
    return today.year;
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (parsedValue) return parsedValue.month;
    if (parsedMin) return parsedMin.month;
    return today.month;
  });

  const [prevValue, setPrevValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync calendar focus with value when value changes externally
  if (value !== prevValue) {
    setPrevValue(value);
    if (parsedValue) {
      setCurrentYear(parsedValue.year);
      setCurrentMonth(parsedValue.month);
    }
  }

  // Click-outside listener
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setViewMode("days");
        onBlur?.();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setViewMode("days");
        onBlur?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onBlur]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Check if a date is out of allowed min/max range
  const isDateDisabled = useCallback(
    (year: number, month: number, day: number) => {
      const dateIso = formatDateISO(year, month, day);
      if (minDate && dateIso < minDate) return true;
      if (maxDate && dateIso > maxDate) return true;
      return false;
    },
    [minDate, maxDate]
  );

  // Generate calendar days grid (only rows needed)
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      iso: string;
      disabled: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // 1. Previous month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const iso = formatDateISO(y, m, d);
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        iso,
        disabled: isDateDisabled(y, m, d),
        isToday: iso === today.iso,
        isSelected: iso === value,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = formatDateISO(currentYear, currentMonth, d);
      days.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        iso,
        disabled: isDateDisabled(currentYear, currentMonth, d),
        isToday: iso === today.iso,
        isSelected: iso === value,
      });
    }

    // 3. Next month padding only to complete the final week row
    const remainder = days.length % 7;
    if (remainder > 0) {
      const fillCount = 7 - remainder;
      for (let d = 1; d <= fillCount; d++) {
        const m = currentMonth === 11 ? 0 : currentMonth + 1;
        const y = currentMonth === 11 ? currentYear + 1 : currentYear;
        const iso = formatDateISO(y, m, d);
        days.push({
          day: d,
          month: m,
          year: y,
          isCurrentMonth: false,
          iso,
          disabled: isDateDisabled(y, m, d),
          isToday: iso === today.iso,
          isSelected: iso === value,
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, isDateDisabled, today.iso, value]);

  // Select a specific day and close immediately for swift UX
  const handleSelectDay = (iso: string, disabledDay: boolean) => {
    if (disabledDay || disabled) return;
    onChange(iso);
    setIsOpen(false);
    setViewMode("days");
  };

  const jumpToToday = () => {
    if (minDate && today.iso < minDate) return;
    if (maxDate && today.iso > maxDate) return;
    onChange(today.iso);
    setCurrentYear(today.year);
    setCurrentMonth(today.month);
    setIsOpen(false);
    setViewMode("days");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML form compatibility */}
      <input type="hidden" name={name} id={id} value={value} />

      {/* Input Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setViewMode("days");
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm transition-all cursor-pointer text-left ${
          hasError
            ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 text-[#171923]"
            : isOpen
            ? "border-[#5146E5] bg-white ring-2 ring-[#5146E5]/15 text-[#171923]"
            : "border-[#E8E5DF] hover:border-[#D5D1C8] focus:border-[#5146E5] text-[#171923]"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-[#F3F4F6]" : ""}`}
      >
        {/* Left Calendar Icon */}
        <CalendarIcon
          className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
            hasError
              ? "text-[#DC2626]"
              : isOpen
              ? "text-[#5146E5]"
              : "text-[#686D78]"
          }`}
        />

        {/* Formatted Date or Placeholder */}
        <span
          className={`truncate select-none font-medium ${
            value ? "text-[#171923]" : "text-[#9CA3AF]"
          }`}
        >
          {value ? formatDisplayDate(value) : placeholder}
        </span>

        {/* Right Action Icons (Clear + Caret) */}
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {allowClear && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="p-1 rounded-md text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
              title="Clear date"
              aria-label="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#9CA3AF] transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#5146E5]" : ""
            }`}
          />
        </div>
      </button>

      {/* Compact Calendar Popover Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Calendar date picker"
          className="absolute left-0 mt-1.5 z-50 w-[280px] bg-white border border-[#E8E5DF] rounded-2xl shadow-[0_12px_32px_rgba(23,25,35,0.1)] p-3 animate-fade-in"
        >
          {/* Compact Header Bar */}
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#E8E5DF]/70">
            {/* Prev Month Button */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-[#686D78] hover:text-[#171923] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month & Year Title Dropdown Switcher */}
            <button
              type="button"
              onClick={() =>
                setViewMode((mode) => (mode === "months" ? "days" : "months"))
              }
              className="px-2 py-0.5 text-xs font-bold text-[#171923] hover:text-[#5146E5] hover:bg-[#EEEAFE]/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{MONTH_NAMES[currentMonth]}</span>
              <span className="text-[#686D78] font-normal">{currentYear}</span>
              <ChevronDown className="w-3 h-3 text-[#686D78]" />
            </button>

            {/* Next Month Button */}
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-[#686D78] hover:text-[#171923] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* VIEW 1: Quick 12-Month Grid */}
          {viewMode === "months" ? (
            <div className="space-y-2 py-1">
              {/* Year navigation stepper */}
              <div className="flex items-center justify-between px-1 text-xs font-semibold text-[#171923]">
                <button
                  type="button"
                  onClick={() => setCurrentYear((y) => y - 1)}
                  className="p-1 text-[#686D78] hover:text-[#171923] rounded hover:bg-[#FAF9F6]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-xs text-[#5146E5]">
                  {currentYear}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentYear((y) => y + 1)}
                  className="p-1 text-[#686D78] hover:text-[#171923] rounded hover:bg-[#FAF9F6]"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 12 Months Grid */}
              <div className="grid grid-cols-3 gap-1">
                {MONTH_SHORT.map((name, idx) => {
                  const isCurrent = idx === currentMonth;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setCurrentMonth(idx);
                        setViewMode("days");
                      }}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#5146E5] text-white shadow-xs"
                          : "text-[#171923] hover:bg-[#FAF9F6] hover:text-[#5146E5]"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW 2: Standard Days View */
            <div>
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                {DAY_NAMES.map((d) => (
                  <div
                    key={d}
                    className="text-[10px] font-semibold text-[#9CA3AF] uppercase py-0.5"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((d, index) => {
                  return (
                    <button
                      key={`${d.iso}-${index}`}
                      type="button"
                      disabled={d.disabled}
                      onClick={() => handleSelectDay(d.iso, d.disabled)}
                      className={`h-7.5 w-full rounded-lg text-xs font-medium transition-all flex items-center justify-center cursor-pointer relative ${
                        d.isSelected
                          ? "bg-[#5146E5] text-white font-bold shadow-xs hover:bg-[#4338CA]"
                          : d.isToday
                          ? "border border-[#5146E5] text-[#5146E5] font-semibold bg-[#EEEAFE]/30 hover:bg-[#EEEAFE]/60"
                          : d.disabled
                          ? "text-[#E5E7EB] cursor-not-allowed opacity-35 line-through"
                          : d.isCurrentMonth
                          ? "text-[#171923] hover:bg-[#FAF9F6] hover:text-[#5146E5]"
                          : "text-[#D1D5DB] hover:text-[#9CA3AF] hover:bg-[#FAF9F6]/50"
                      }`}
                    >
                      <span>{d.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Slim Utility Footer */}
          <div className="mt-2 pt-1.5 border-t border-[#E8E5DF]/70 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={jumpToToday}
              className="text-[#5146E5] hover:text-[#4338CA] font-medium transition-colors cursor-pointer"
            >
              Today
            </button>

            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="text-[#DC2626] hover:underline font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
