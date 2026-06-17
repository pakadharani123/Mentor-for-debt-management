import React from 'react';

// Single Card Skeleton
export const SkeletonCard = () => {
  return (
    <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl animate-pulse space-y-4">
      <div class="flex items-center justify-between">
        <div class="h-3 w-24 bg-slate-800 rounded"></div>
        <div class="w-8 h-8 bg-slate-800 rounded-xl"></div>
      </div>
      <div class="h-7 w-36 bg-slate-800 rounded mt-4"></div>
    </div>
  );
};



// Grid of Cards Skeleton
export const SkeletonGrid = ({ count = 4 }) => {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};

// Table Listing Skeleton
export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div class="bg-brand-card border border-slate-800/80 rounded-2xl p-6 animate-pulse space-y-5">
      <div class="flex justify-between items-center pb-4 border-b border-slate-800">
        <div class="h-4 w-32 bg-slate-800 rounded"></div>
        <div class="h-8 w-24 bg-slate-800 rounded-xl"></div>
      </div>
      <div class="space-y-4">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} class="flex items-center justify-between py-2">
            <div class="h-3 w-1/4 bg-slate-800 rounded"></div>
            <div class="h-3 w-1/6 bg-slate-800 rounded"></div>
            <div class="h-3 w-1/12 bg-slate-800 rounded"></div>
            <div class="h-3 w-1/6 bg-slate-800 rounded"></div>
          </div>
        ))}

      </div>
    </div>
  );
};

const SkeletonScreen = {
  Card: SkeletonCard,
  Grid: SkeletonGrid,
  Table: SkeletonTable
};

export default SkeletonScreen;
