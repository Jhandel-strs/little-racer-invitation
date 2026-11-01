import React, { useEffect, useState } from 'react';
import { formatStandardTime, parseStandardTime, toTwentyFourHourTime } from '../../utils/time';

interface Props {
  label: string;
  value: string;
  format: '12-hour' | '24-hour';
  onChange: (value: string) => void;
}

export const StandardTimeInput: React.FC<Props> = ({ label, value, format, onChange }) => {
  const [inputValue, setInputValue] = useState(formatStandardTime(value, format));

  useEffect(() => {
    setInputValue(formatStandardTime(value, format));
  }, [value, format]);

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        inputMode="text"
        aria-label={label}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          const parts = parseStandardTime(e.target.value);
          if (parts) onChange(toTwentyFourHourTime(parts));
        }}
        onBlur={() => setInputValue(formatStandardTime(value, format))}
        placeholder={format === '12-hour' ? '7:00 PM' : '19:00'}
        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
      />
      <p className="mt-1 text-[10px] text-slate-500">
        {format === '12-hour' ? 'Enter time with AM or PM, for example 7:00 PM.' : 'Enter time as hours and minutes, for example 19:00.'}
      </p>
    </div>
  );
};
