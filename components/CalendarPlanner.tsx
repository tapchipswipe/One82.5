import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Edit3, Sparkles } from 'lucide-react';
import { CalendarEvent } from '../types';
import { StorageService } from '../services/storage';

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const monthLabel = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const CalendarPlanner: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: toDateKey(new Date()),
    note: '',
    impactDirection: 'neutral' as CalendarEvent['impactDirection'],
    impactPercent: 0
  });

  useEffect(() => {
    void StorageService.getCalendarEventsResolved('merchant').then(setEvents);

    const onCalendarUpdate = () => {
      void StorageService.getCalendarEventsResolved('merchant').then(setEvents);
    };
    window.addEventListener('one82_calendar_events_update', onCalendarUpdate);
    return () => window.removeEventListener('one82_calendar_events_update', onCalendarUpdate);
  }, []);

  const days = useMemo(() => {
    const first = startOfMonth(currentMonth);
    const last = endOfMonth(currentMonth);
    const leading = first.getDay();
    const totalDays = last.getDate();

    const values: Array<Date | null> = [];
    for (let index = 0; index < leading; index += 1) values.push(null);

    for (let day = 1; day <= totalDays; day += 1) {
      values.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }

    while (values.length % 7 !== 0) values.push(null);
    return values;
  }, [currentMonth]);

  const selectedDateEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate),
    [events, selectedDate]
  );

  const upcomingSummary = useMemo(() => {
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);

    const upcoming = events.filter((event) => {
      const date = new Date(`${event.date}T00:00:00`);
      return date >= now && date <= horizon;
    });

    const positive = upcoming
      .filter((event) => event.impactDirection === 'up')
      .reduce((sum, event) => sum + event.impactPercent, 0);
    const negative = upcoming
      .filter((event) => event.impactDirection === 'down')
      .reduce((sum, event) => sum + event.impactPercent, 0);

    return { total: upcoming.length, positive, negative };
  }, [events]);

  const saveEvents = (nextEvents: CalendarEvent[]) => {
    setEvents(nextEvents);
    void StorageService.saveCalendarEventsResolved('merchant', nextEvents);
  };

  const openCreate = (date?: string) => {
    setEditingEvent(null);
    setForm({
      title: '',
      date: date || selectedDate,
      note: '',
      impactDirection: 'neutral',
      impactPercent: 0
    });
    setShowEditor(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      date: event.date,
      note: event.note || '',
      impactDirection: event.impactDirection,
      impactPercent: event.impactPercent
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;

    const now = Date.now();

    if (editingEvent) {
      const updated = events.map((event) =>
        event.id === editingEvent.id
          ? {
              ...event,
              title: form.title.trim(),
              date: form.date,
              note: form.note.trim(),
              impactDirection: form.impactDirection,
              impactPercent: Math.max(0, Math.min(50, Number(form.impactPercent) || 0)),
              updatedAt: now
            }
          : event
      );
      saveEvents(updated);
    } else {
      const created: CalendarEvent = {
        id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: form.title.trim(),
        date: form.date,
        note: form.note.trim(),
        impactDirection: form.impactDirection,
        impactPercent: Math.max(0, Math.min(50, Number(form.impactPercent) || 0)),
        createdAt: now,
        updatedAt: now
      };
      saveEvents([...events, created]);
    }

    setShowEditor(false);
    setEditingEvent(null);
  };

  const handleDelete = (eventId: string) => {
    saveEvents(events.filter((event) => event.id !== eventId));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary-600" />
            Business Calendar
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track operational events and quantify expected revenue impact for forecasting.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
        <div className="text-sm text-indigo-800 dark:text-indigo-200">
          <p className="font-semibold">30-Day Event Signal</p>
          <p>
            {upcomingSummary.total} event{upcomingSummary.total === 1 ? '' : 's'} scheduled · Potential uplift +{upcomingSummary.positive}% · Potential drag -{upcomingSummary.negative}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h3 className="font-semibold text-slate-900 dark:text-white">{monthLabel(currentMonth)}</h3>

            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-3 py-2 text-center">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty_${index}`} className="min-h-[84px] border-b border-r border-slate-100 dark:border-slate-800" />;
              }

              const dateKey = toDateKey(day);
              const dateEvents = events.filter((event) => event.date === dateKey);
              const isSelected = selectedDate === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  className={`min-h-[84px] p-2 border-b border-r text-left border-slate-100 dark:border-slate-800 transition-colors ${
                    isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{day.getDate()}</div>
                  <div className="mt-1 space-y-1">
                    {dateEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                          event.impactDirection === 'up'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : event.impactDirection === 'down'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dateEvents.length > 2 && (
                      <div className="text-[10px] text-slate-400">+{dateEvents.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">{selectedDate}</h3>
            <button
              type="button"
              onClick={() => openCreate(selectedDate)}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {selectedDateEvents.map((event) => (
              <div key={event.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{event.note || 'No notes'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(event)}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id)}
                      className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    event.impactDirection === 'up'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : event.impactDirection === 'down'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}>
                    {event.impactDirection === 'up' ? `+${event.impactPercent}%` : event.impactDirection === 'down' ? `-${event.impactPercent}%` : 'Neutral'}
                  </span>
                </div>
              </div>
            ))}

            {selectedDateEvents.length === 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                No events for this day.
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">{editingEvent ? 'Edit Event' : 'New Event'}</h3>

            <div>
              <label className="text-xs font-medium text-slate-500">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Impact</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {[
                  { id: 'up', label: 'Increase' },
                  { id: 'neutral', label: 'Neutral' },
                  { id: 'down', label: 'Decrease' }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, impactDirection: option.id as CalendarEvent['impactDirection'] }))}
                    className={`px-2 py-2 rounded-lg border text-xs font-medium ${
                      form.impactDirection === option.id
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Impact % (0–50)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={form.impactPercent}
                onChange={(event) => setForm((prev) => ({ ...prev, impactPercent: Number(event.target.value) }))}
                className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Notes</label>
              <textarea
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPlanner;
