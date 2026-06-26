"use client";

import Image from "next/image";
import { useState } from "react";

export function BrandMark() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="text-base font-bold text-white">
        PLN
      </div>
    );
  }

  return (
    <Image
      src="/pln.png"
      alt="Logo PLN"
      width={40}
      height={40}
      className="h-8 w-auto object-contain"
      priority
      onError={() => setHasError(true)}
    />
  );
}