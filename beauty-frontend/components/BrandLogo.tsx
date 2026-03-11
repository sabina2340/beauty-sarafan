"use client";

import { useEffect, useState } from "react";
import { readBrandLogo } from "@/lib/brand";

type Props = {
  className?: string;
};

export function BrandLogo({ className }: Props) {
  const [logo, setLogo] = useState<string>("/logo-placeholder.svg");
  useEffect(() => {
    setLogo(readBrandLogo() || "/logo-placeholder.png");
  }, []);
  return <img src={logo} alt="Логотип Сарафан" className={className} />;
}
