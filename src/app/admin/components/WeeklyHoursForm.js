'use client';

const DAYS_OF_WEEK = [
  { key: 'seg', label: 'Segunda-feira' },
  { key: 'ter', label: 'Terça-feira' },
  { key: 'qua', label: 'Quarta-feira' },
  { key: 'qui', label: 'Quinta-feira' },
  { key: 'sex', label: 'Sexta-feira' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

export const defaultWeeklyHours = () => ({
  seg: { open: '09:00', close: '19:00', closed: false },
  ter: { open: '09:00', close: '19:00', closed: false },
  qua: { open: '09:00', close: '19:00', closed: false },
  qui: { open: '09:00', close: '19:00', closed: false },
  sex: { open: '09:00', close: '19:00', closed: false },
  sab: { open: '09:00', close: '19:00', closed: false },
  dom: { open: '09:00', close: '19:00', closed: true },
});

function formatTimeDigits(rawValue) {
  const digits = rawValue.replace(/\D/g, '');
  if (digits.length > 2) {
    const hh = Math.min(parseInt(digits.slice(0, 2), 10), 23).toString().padStart(2, '0');
    const mmRaw = digits.slice(2, 4);
    const mm = mmRaw.length > 0 ? Math.min(parseInt(mmRaw, 10), 59).toString().padStart(2, '0') : '';
    return digits.length >= 4 ? `${hh}:${mm.slice(0, 2)}` : `${hh}:${mmRaw}`;
  }
  if (digits.length > 0 && parseInt(digits, 10) > 23) return '23';
  return digits;
}

// Extraído de StoreSettings.js: formulário de horário semanal, reaproveitado para Boutique e Restaurante.
export default function WeeklyHoursForm({ value, onChange }) {
  const weeklyData = value || defaultWeeklyHours();

  const updateDay = (dayKey, field, fieldValue) => {
    const dayInfo = weeklyData[dayKey] || { open: '09:00', close: '19:00', closed: false };
    onChange({ ...weeklyData, [dayKey]: { ...dayInfo, [field]: fieldValue } });
  };

  return (
    <div className="flex flex-col gap-2 mt-2 bg-base-200/30 p-4 rounded-lg border border-base-300 w-full">
      <label className="label-text font-bold text-xs uppercase tracking-wider text-base-content/60 mb-2">
        Horários de Funcionamento por Dia
      </label>
      {DAYS_OF_WEEK.map((day) => {
        const dayInfo = weeklyData[day.key] || { open: '09:00', close: '19:00', closed: false };
        return (
          <div key={day.key} className="flex items-center justify-between gap-4 py-2 border-b border-base-300/10 last:border-b-0">
            <span className="text-xs font-bold text-base-content/80 w-24 md:w-28">{day.label}</span>
            <div className="flex items-center gap-4">
              <label className="label cursor-pointer p-0 gap-1.5">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-primary"
                  checked={dayInfo.closed}
                  onChange={(e) => updateDay(day.key, 'closed', e.target.checked)}
                />
                <span className="label-text text-xs font-medium">Fechado</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="09:00"
                  maxLength={5}
                  className="input input-bordered input-xs w-16 text-center bg-base-100 focus:border-primary disabled:opacity-40"
                  value={dayInfo.open || ''}
                  disabled={dayInfo.closed}
                  onChange={(e) => updateDay(day.key, 'open', formatTimeDigits(e.target.value))}
                />
                <span className="text-xs text-base-content/40">às</span>
                <input
                  type="text"
                  placeholder="19:00"
                  maxLength={5}
                  className="input input-bordered input-xs w-16 text-center bg-base-100 focus:border-primary disabled:opacity-40"
                  value={dayInfo.close || ''}
                  disabled={dayInfo.closed}
                  onChange={(e) => updateDay(day.key, 'close', formatTimeDigits(e.target.value))}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
