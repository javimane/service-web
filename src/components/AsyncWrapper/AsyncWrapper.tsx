import React, { ReactNode } from "react";
import Skeleton from "../Skeleton/Skeleton";

interface AsyncWrapperProps {
  isLoading: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
}

export default function AsyncWrapper({
  isLoading,
  skeleton,
  children,
}: AsyncWrapperProps) {
  if (isLoading) {
    return <>{skeleton || <Skeleton className="w-full h-32" />}</>;
  }

  return <>{children}</>;
}
