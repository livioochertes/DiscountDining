// Week view helper functions to add to restaurant-portal.tsx

// Add these state variables:
const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');

// Add these helper functions:
const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const getWeekDays = (date: Date) => {
  const start = getWeekStart(date);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
};

const formatWeekRange = (date: Date) => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  
  if (sameMonth && sameYear) {
    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
  } else if (sameYear) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
};

const navigateWeek = (direction: 'prev' | 'next') => {
  setCurrentDate(prev => {
    const newDate = new Date(prev);
    const days = direction === 'prev' ? -7 : 7;
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  });
};

// Modified calendar header with toggle buttons:
<div className="flex items-center gap-4">
  <div className="flex bg-gray-100 rounded-lg p-1">
    <Button
      variant={calendarView === 'month' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setCalendarView('month')}
      className="text-xs"
    >
      Month
    </Button>
    <Button
      variant={calendarView === 'week' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setCalendarView('week')}
      className="text-xs"
    >
      Week
    </Button>
  </div>
  <div className="flex items-center gap-2">
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => calendarView === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
    >
      <ChevronLeft className="w-4 h-4" />
    </Button>
    <span className="text-sm font-medium min-w-[150px] text-center">
      {calendarView === 'month' ? formatCalendarDate(currentDate) : formatWeekRange(currentDate)}
    </span>
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => calendarView === 'month' ? navigateMonth('next') : navigateWeek('next')}
    >
      <ChevronRight className="w-4 h-4" />
    </Button>
  </div>
</div>

// Week view calendar grid (add after month view):
{calendarView === 'week' && (
  <div className="grid grid-cols-7 gap-4">
    {getWeekDays(currentDate).map((day) => {
      const dayReservations = getReservationsForDate(day);
      const isToday = day.toDateString() === new Date().toDateString();
      const isSelected = selectedDay?.toDateString() === day.toDateString();
      
      return (
        <div
          key={day.toISOString()}
          className={`
            h-40 border rounded-lg cursor-pointer transition-all hover:shadow-md
            ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
            ${isSelected ? 'ring-2 ring-blue-500' : ''}
            hover:bg-gray-50
          `}
          onClick={() => handleDayClick(day)}
        >
          <div className="p-3 h-full flex flex-col">
            <div className="text-sm font-medium text-gray-900 mb-2">
              {day.getDate()}
            </div>
            {dayReservations.length > 0 && (
              <div className="flex-1 space-y-1 overflow-hidden">
                {dayReservations.slice(0, 4).map((reservation: any) => (
                  <div
                    key={reservation.id}
                    className={`
                      text-xs px-2 py-1 rounded text-white truncate
                      ${reservation.status === 'confirmed'
                        ? 'bg-green-500'
                        : reservation.status === 'pending'
                        ? 'bg-amber-500'
                        : 'bg-gray-500'
                      }
                    `}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {reservation.customerName}
                  </div>
                ))}
                {dayReservations.length > 4 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayReservations.length - 4} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
)}