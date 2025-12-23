import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { persianToGregorian, getPersianMonthDays, getPersianMonthName, gregorianToPersian } from '@/lib/utils';

interface PersianDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  placeholder = "انتخاب تاریخ"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(1403); // Current Persian year
  const [currentMonth, setCurrentMonth] = useState(10); // Current Persian month (Dey)

  useEffect(() => {
    // Set current Persian date as default
    if (!value) {
      const today = new Date();
      const persianDate = gregorianToPersian(today);
      const parts = persianDate.split(' ');
      const year = parseInt(parts[2]);
      const monthIndex = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
      ].indexOf(parts[1]) + 1;

      setCurrentYear(year);
      setCurrentMonth(monthIndex);
    }
  }, [value]);

  const handleDateSelect = (day: number) => {
    const gregorianDate = persianToGregorian(currentYear, currentMonth, day);
    const dateString = gregorianDate.toISOString().split('T')[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getPersianMonthDays(currentMonth);
    const days = [];

    // Calculate what day of the week the first day falls on
    // For Persian calendar, we start from Saturday (0)
    const firstDayOfMonth = persianToGregorian(currentYear, currentMonth, 1);
    const startDayOfWeek = (firstDayOfMonth.getDay() + 1) % 7; // Convert Sunday=0 to Saturday=0

    // Add empty cells for days before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className="w-9 h-9 text-sm hover:bg-primary hover:text-primary-foreground rounded-lg transition-all duration-200 flex items-center justify-center font-medium hover:scale-105 hover:shadow-md"
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return gregorianToPersian(date);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={formatDisplayDate(value || '')}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
          placeholder={placeholder}
          className="w-full h-10 rounded-lg border border-input bg-background px-4 py-2 text-sm shadow-sm cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 z-50 w-72 bg-background border border-border rounded-xl shadow-2xl p-4 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevMonth}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {getPersianMonthName(currentMonth)}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentYear}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {/* Day headers - Persian weekdays */}
            <div className="text-xs text-muted-foreground py-2 font-semibold bg-muted/50 rounded-md">شنبه</div>
            <div className="text-xs text-muted-foreground py-2 font-semibold bg-muted/50 rounded-md">یکشنبه</div>
            <div className="text-xs text-muted-foreground py-2 font-semibold bg-muted/50 rounded-md">دوشنبه</div>
            <div className="text-xs text-muted-foreground py-2 font-semibold bg-muted/50 rounded-md">سه‌شنبه</div>
            <div className="text-xs text-muted-foreground py-2 font-semibold bg-muted/50 rounded-md">چهارشنبه</div>
            <div className="text-xs text-muted-foreground py-2 font-semibold bg-muted/50 rounded-md">پنج‌شنبه</div>
            <div className="text-xs text-muted-foreground py-2 font-semibold bg-muted/50 rounded-md">جمعه</div>

            {/* Days */}
            {renderCalendar()}
          </div>

          {/* Today button */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const dateString = today.toISOString().split('T')[0];
                onChange(dateString);
                setIsOpen(false);
              }}
              className="w-full text-sm font-medium bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 border-primary/20 hover:border-primary/30 transition-all duration-200"
            >
              📅 امروز
            </Button>
          </div>
        </div>
      )}

      {/* Overlay to close calendar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default PersianDatePicker;