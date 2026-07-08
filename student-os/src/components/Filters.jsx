import { ChevronDown } from 'lucide-react'
import { SEMESTERS, RESOURCE_TYPES, SORT_OPTIONS } from '../constants/resourceOptions.js'

function Select({ value, onChange, options, placeholder, ariaLabel }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="appearance-none rounded-lg bg-white/[0.03] border border-white/10 pl-3 pr-8 py-2.5 text-sm text-ink outline-none focus:border-primary/60 focus:bg-white/[0.05] transition-colors cursor-pointer"
      >
        <option value="" className="bg-base-card">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-base-card">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
      />
    </div>
  )
}

export default function Filters({
  semester,
  onSemesterChange,
  subject,
  onSubjectChange,
  subjectOptions = [],
  fileType,
  onFileTypeChange,
  sort,
  onSortChange,
  showSemester = true,
  showSubject = true,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {showSemester && (
        <Select
          value={semester}
          onChange={onSemesterChange}
          placeholder="All Semesters"
          ariaLabel="Filter by semester"
          options={SEMESTERS.map((s) => ({ value: s, label: `Semester ${s}` }))}
        />
      )}
      {showSubject && (
        <Select
          value={subject}
          onChange={onSubjectChange}
          placeholder="All Subjects"
          ariaLabel="Filter by subject"
          options={subjectOptions.map((s) => ({ value: s, label: s }))}
        />
      )}
      <Select
        value={fileType}
        onChange={onFileTypeChange}
        placeholder="All Types"
        ariaLabel="Filter by file type"
        options={RESOURCE_TYPES}
      />
      <Select
        value={sort}
        onChange={onSortChange}
        placeholder="Sort"
        ariaLabel="Sort resources"
        options={SORT_OPTIONS}
      />
    </div>
  )
}
