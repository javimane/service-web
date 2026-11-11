"use client";

import RegisterPlanSelection from "@/views/Register/RegisterPlanSelection";

type PlansModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function PlansModal({ isOpen, onClose }: PlansModalProps) {
  if (!isOpen) return null;
  return <RegisterPlanSelection onClose={onClose} />;
}
