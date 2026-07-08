const shimmer = 'animate-pulse bg-white/[0.04]'

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-base-card/40 p-5">
      <div className={`w-10 h-10 rounded-lg ${shimmer}`} />
      <div className={`h-4 w-3/4 rounded mt-4 ${shimmer}`} />
      <div className={`h-3 w-full rounded mt-3 ${shimmer}`} />
      <div className={`h-3 w-2/3 rounded mt-2 ${shimmer}`} />
      <div className="flex gap-2 mt-4">
        <div className={`h-5 w-14 rounded-full ${shimmer}`} />
        <div className={`h-5 w-14 rounded-full ${shimmer}`} />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-base-card/40 p-4">
      <div className={`w-11 h-11 rounded-lg shrink-0 ${shimmer}`} />
      <div className="flex-1 min-w-0 space-y-2">
        <div className={`h-3.5 w-1/3 rounded ${shimmer}`} />
        <div className={`h-3 w-1/2 rounded ${shimmer}`} />
      </div>
      <div className={`h-8 w-20 rounded-lg shrink-0 ${shimmer}`} />
    </div>
  )
}

export default function LoadingSkeleton({ variant = 'grid', count = 6 }) {
  const Item = variant === 'list' ? ListSkeleton : CardSkeleton

  return (
    <div
      className={
        variant === 'list'
          ? 'space-y-3'
          : 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </div>
  )
}
