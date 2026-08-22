import React from "react";
import CharacterCard from "./CharacterCard";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export default function CharacterGrid({ 
  characters, 
  isLoading, 
  pagination, 
  onPageChange 
}) {
  // Skeleton loader for loading state
  const skeletons = Array.from({ length: 8 }, (_, i) => i);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {skeletons.map((index) => (
            <div key={index} className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 animate-pulse flex flex-col h-full">
              <div className="aspect-[3/4] bg-slate-700" />
              <div className="p-4 space-y-3 flex-grow flex flex-col justify-end">
                <div className="h-4 bg-slate-700 rounded w-1/4" />
                <div className="h-6 bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-slate-700 rounded w-1/2" />
                <div className="h-8 bg-slate-700 rounded w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!characters || characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 px-4">
        <Inbox className="h-16 w-16 mb-4 text-slate-600" />
        <h3 className="text-xl font-bold text-slate-300">No Characters Found</h3>
        <p className="text-sm mt-1 text-center max-w-sm">
          We couldn't find any characters matching your criteria. Try adjusting your search query or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grid of Characters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {characters.map((character) => (
          <div key={character._id}>
            <CharacterCard character={character} />
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="flex items-center space-x-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:hover:bg-slate-800 disabled:hover:text-slate-300 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </button>
          
          <div className="text-sm text-slate-400 font-semibold px-4">
            Page {pagination.page} of {pagination.pages}
          </div>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="flex items-center space-x-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:hover:bg-slate-800 disabled:hover:text-slate-300 transition"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
