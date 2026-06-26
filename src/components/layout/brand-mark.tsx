"use client";

import Image from "next/image";
import { useState } from "react";

export function BrandMark() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="text-lg font-bold text-white">
        PLN
      </div>
    );
  }

  return (
    <Image
      src="/pln.png"
      alt="Logo PLN"
      width={60}
      height={60}
      className="h-11 w-auto object-contain"
      priority
      onError={() => setHasError(true)}
    />
  );
}