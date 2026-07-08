import { useOutletContext } from 'react-router-dom'
import { Menu, Plus, LayoutGrid, List, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import SearchBar from './SearchBar.jsx'
import Filters from './Filters.jsx'

export default function Topbar({
  title,
  search,
  onSearchChange,
  filters,
  view,
  onViewChange,
  onUploadClick,
}) {
  const { user } = useAuth()
  // AppLayout provides this via <Outlet context={...}/>; falls back to a
  // no-op if a page renders Topbar outside that layout.
  const outletCtx = useOutletContext() || {}
  const openSidebar = outletCtx.openSidebar || (() => {})

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  return (
    <header className="sticky top-0 z-20 bg-base/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={openSidebar}
            aria-label="Open menu"
            className="lg:hidden text-ink-muted hover:text-ink transition-colors shrink-0"
          >
            <Menu size={20} />
          </button>

          {title && !onSearchChange && (
            <h1 className="font-display text-lg font-semibold text-ink truncate">{title}</h1>
          )}

          {onSearchChange && <SearchBar value={search} onChange={onSearchChange} />}

          <div className="ml-auto flex items-center gap-3 shrink-0">
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-3.5 py-2 text-xs font-medium text-white shadow-glow"
              >
                <Plus size={14} />
                Upload Resource
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-medium text-primary-light shrink-0">
              {initials || <User size={14} />}
            </div>
          </div>
        </div>

        {(filters || onViewChange || onUploadClick) && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {filters}

            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="sm:hidden inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-3.5 py-2 text-xs font-medium text-white shadow-glow"
              >
                <Plus size={14} />
                Upload
              </button>
            )}

            {onViewChange && (
              <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 p-0.5">
                <button
                  onClick={() => onViewChange('grid')}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  className={`p-1.5 rounded-md transition-colors ${
                    view === 'grid' ? 'bg-primary/20 text-primary-light' : 'text-ink-faint hover:text-ink-muted'
                  }`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => onViewChange('list')}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  className={`p-1.5 rounded-md transition-colors ${
                    view === 'list' ? 'bg-primary/20 text-primary-light' : 'text-ink-faint hover:text-ink-muted'
                  }`}
                >
                  <List size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
