export default function CouturierCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden animate-pulse">
      <div className="bg-gray-300 h-37.5 w-full"></div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-5 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/6"></div>
        </div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        <div className="flex gap-2">
            <div className="h-5 bg-gray-300 rounded-full w-20"></div>
            <div className="h-5 bg-gray-300 rounded-full w-24"></div>
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-9 bg-gray-300 rounded-md w-full"></div>
          <div className="h-9 bg-gray-300 rounded-md w-full"></div>
        </div>
      </div>
    </div>
  );
}