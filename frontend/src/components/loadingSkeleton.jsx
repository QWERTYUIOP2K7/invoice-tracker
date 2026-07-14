export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200"></div>
      <div className="h-32 bg-gray-200"></div>
      <div className="h-6 bg-gray-200 w-3/4"></div>
    </div>
  );
}