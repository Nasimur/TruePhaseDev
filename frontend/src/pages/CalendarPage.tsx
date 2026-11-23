import { useEffect, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import type { PeriodRecord } from "../models/types";
import {
  dateKey,
  displayDate,
  localTodayKey,
  monthDates,
  monthForKey,
  shiftedMonth,
} from "../features/periods/dateUtils";
import {
  demoPeriodRepository,
  type PeriodRepository,
} from "../features/periods/periodRepository";
import {
  validatePeriod,
  type PeriodFormErrors,
} from "../features/periods/periodValidation";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const emptyForm = { id: null as string | null, startDate: "", endDate: "" };
type FormState = typeof emptyForm;

function coveringPeriod(date: string, records: PeriodRecord[], today: string) {
  return records.find(
    (record) => record.startDate <= date && date <= (record.endDate ?? today),
  );
}

export function CalendarPage({
  repository = demoPeriodRepository,
}: {
  repository?: PeriodRepository;
}) {
  const today = localTodayKey();
  const [month, setMonth] = useState(() => monthForKey(today));
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<PeriodFormErrors>({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    repository
      .list()
      .then((records) => {
        if (active) setPeriods(records);
      })
      .catch(() => {
        if (active)
          setNotice("Unable to load period records. Try reloading the page.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository]);

  function startNew(startDate = "") {
    setForm({ ...emptyForm, startDate });
    setErrors({});
    setNotice("");
  }

  function editPeriod(record: PeriodRecord) {
    setForm({
      id: record.id,
      startDate: record.startDate,
      endDate: record.endDate ?? "",
    });
    setMonth(monthForKey(record.startDate));
    setErrors({});
    setNotice("");
  }

  function selectDate(key: string) {
    const record = coveringPeriod(key, periods, today);
    if (record) editPeriod(record);
    else {
      startNew(key);
      setMonth(monthForKey(key));
    }
  }

  async function submitPeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate: PeriodRecord = {
      id: form.id ?? crypto.randomUUID(),
      startDate: form.startDate,
      endDate: form.endDate || null,
    };
    const nextErrors = validatePeriod(candidate, periods);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await repository.save(candidate);
      setPeriods(await repository.list());
      setMonth(monthForKey(candidate.startDate));
      setForm({
        id: candidate.id,
        startDate: candidate.startDate,
        endDate: candidate.endDate ?? "",
      });
      setNotice(
        form.id ? "Period updated in this demo." : "Period added to this demo.",
      );
    } catch {
      setNotice("Unable to save this period. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removePeriod() {
    if (!form.id) return;
    setSaving(true);
    try {
      await repository.remove(form.id);
      setPeriods(await repository.list());
      setForm(emptyForm);
      setErrors({});
      setNotice("Period removed from this demo.");
    } catch {
      setNotice("Unable to remove this period. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(month);
  const visiblePeriods = [...periods]
    .filter((record) => {
      const first = dateKey(
        new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1)),
      );
      const last = dateKey(
        new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)),
      );
      return record.startDate <= last && (record.endDate ?? today) >= first;
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="page calendar-page">
      <div className="page-heading calendar-page-heading">
        <div>
          <p className="eyebrow">YOUR CALENDAR</p>
          <h1>Keep your cycle in view</h1>
          <p className="page-subtitle">
            Explore the month and add or edit period dates.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          aria-label="Add period"
          onClick={() => startNew()}
        >
          <Plus size={17} aria-hidden="true" /> Add period
        </button>
      </div>

      <div className="demo-banner" role="note">
        <CalendarDays size={18} aria-hidden="true" />
        <span>
          <strong>Demo calendar.</strong> These are sample records. Changes
          reset when you reload the page.
        </span>
      </div>

      <div className="calendar-layout">
        <section className="calendar-card" aria-label="Period calendar">
          <div className="calendar-toolbar">
            <div>
              <p className="calendar-caption">MONTHLY VIEW</p>
              <h2>{monthLabel}</h2>
            </div>
            <div className="calendar-controls">
              <button
                type="button"
                className="icon-button"
                aria-label="Previous month"
                onClick={() => setMonth((value) => shiftedMonth(value, -1))}
              >
                <ChevronLeft size={19} />
              </button>
              <button
                type="button"
                className="today-button"
                onClick={() => setMonth(monthForKey(today))}
              >
                Today
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Next month"
                onClick={() => setMonth((value) => shiftedMonth(value, 1))}
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          <div className="calendar-grid" role="grid" aria-label={monthLabel}>
            {weekdays.map((day) => (
              <span key={day} className="weekday" role="columnheader">
                {day}
              </span>
            ))}
            {monthDates(month).map((date) => {
              const key = dateKey(date);
              const record = coveringPeriod(key, periods, today);
              const outside = date.getUTCMonth() !== month.getUTCMonth();
              const selected = key === form.startDate;
              const fullLabel = new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              }).format(date);
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  aria-label={`${fullLabel}${record ? ", recorded period" : ""}`}
                  aria-selected={selected}
                  className={`calendar-day${outside ? " outside" : ""}${record ? " recorded" : ""}${key === today ? " today" : ""}${selected ? " selected" : ""}`}
                  onClick={() => selectDate(key)}
                >
                  <span>{date.getUTCDate()}</span>
                  {record && <i aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            <span className="legend-dot" /> Recorded period{" "}
            <span className="legend-today" /> Today
          </div>
        </section>

        <section
          className="period-form-card"
          aria-labelledby="period-form-title"
        >
          <span className="form-icon">
            <CalendarDays size={23} strokeWidth={1.7} />
          </span>
          <h2 id="period-form-title">
            {form.id ? "Edit period" : "Add a period"}
          </h2>
          <p className="form-intro">
            Choose a date on the calendar or enter dates below.
          </p>
          <form onSubmit={submitPeriod} noValidate>
            <div className="form-field">
              <label htmlFor="period-start">
                Start date <span aria-hidden="true">*</span>
              </label>
              <input
                id="period-start"
                type="date"
                required
                value={form.startDate}
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={
                  errors.startDate ? "period-start-error" : undefined
                }
                onChange={(event) => {
                  setForm({ ...form, startDate: event.target.value });
                  setErrors({ ...errors, startDate: undefined });
                }}
              />
              {errors.startDate && (
                <p className="field-error" id="period-start-error">
                  {errors.startDate}
                </p>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="period-end">
                End date <span className="optional">Optional</span>
              </label>
              <input
                id="period-end"
                type="date"
                value={form.endDate}
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={
                  errors.endDate ? "period-end-error" : "period-end-help"
                }
                onChange={(event) => {
                  setForm({ ...form, endDate: event.target.value });
                  setErrors({ ...errors, endDate: undefined });
                }}
              />
              {errors.endDate ? (
                <p className="field-error" id="period-end-error">
                  {errors.endDate}
                </p>
              ) : (
                <p className="field-help" id="period-end-help">
                  Leave blank if your period is ongoing.
                </p>
              )}
            </div>
            <button
              className="primary-button form-submit"
              type="submit"
              disabled={saving || loading}
            >
              {saving ? "Saving…" : form.id ? "Save changes" : "Add period"}
            </button>
          </form>
          {form.id && (
            <button
              type="button"
              className="remove-button"
              onClick={removePeriod}
              disabled={saving}
            >
              <Trash2 size={16} aria-hidden="true" /> Remove period
            </button>
          )}
          <p className="form-notice" role="status" aria-live="polite">
            {notice}
          </p>
        </section>
      </div>

      <section className="period-list" aria-labelledby="period-list-title">
        <div className="period-list-heading">
          <h2 id="period-list-title">Periods this month</h2>
          <span>
            {visiblePeriods.length}{" "}
            {visiblePeriods.length === 1 ? "record" : "records"}
          </span>
        </div>
        {loading ? (
          <p className="period-empty">Loading sample records…</p>
        ) : visiblePeriods.length ? (
          <div className="period-rows">
            {visiblePeriods.map((record) => (
              <button
                key={record.id}
                type="button"
                className="period-row"
                onClick={() => editPeriod(record)}
              >
                <span className="period-row-icon">
                  <CalendarDays size={18} />
                </span>
                <span>
                  <strong>{displayDate(record.startDate)}</strong>
                  <small>
                    {record.endDate
                      ? `Through ${displayDate(record.endDate)}`
                      : "Ongoing period"}
                  </small>
                </span>
                <span className="period-row-edit">
                  Edit <ChevronRight size={17} aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="period-empty">
            No periods recorded for this month. Select a day to add one.
          </p>
        )}
      </section>
    </div>
  );
}
