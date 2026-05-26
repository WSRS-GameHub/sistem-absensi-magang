"use client";

import Image from "next/image";
import { useState } from "react";

export function BrandMark() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        PLN
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border/40 dark:bg-slate-950">
      <Image
        src="/pln.png"
        alt="Logo PLN"
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}