import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  children?: React.ReactNode;
  className?: string;
}

export function CopyButton({ text, children, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={`h-auto p-1 text-xs hover:bg-gray-100 transition-colors ${className}`}
      title="Click to copy"
    >
      {children || (
        <span
          className={`font-mono ${copied ? "text-emerald-600" : "text-gray-600 hover:text-gray-900"}`}
        >
          {copied ? "Copied!" : text}
        </span>
      )}
    </Button>
  );
}
