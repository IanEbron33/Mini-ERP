"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#341100] group-[.toaster]:border-[#e8decf] group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl font-sans text-xs",
          description: "group-[.toast]:text-[#7f5e35]",
          actionButton:
            "group-[.toast]:bg-[#713105] group-[.toast]:text-white font-semibold",
          cancelButton:
            "group-[.toast]:bg-[#fff7e8] group-[.toast]:text-[#7f5e35]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
