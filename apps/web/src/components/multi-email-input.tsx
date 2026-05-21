import { useState, type KeyboardEvent, type ChangeEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiEmailInputProps {
  placeholder?: string;
  onEmailsChange?: (emails: string[]) => void;
  className?: string;
}

export function MultiEmailInput({
  placeholder = "Enter emails...",
  onEmailsChange,
  className,
}: MultiEmailInputProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [invalidEmail, setInvalidEmail] = useState("");

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();

    if (
      trimmedEmail &&
      isValidEmail(trimmedEmail) &&
      !emails.includes(trimmedEmail)
    ) {
      const newEmails = [...emails, trimmedEmail];
      setEmails(newEmails);
      onEmailsChange?.(newEmails);
      setInputValue("");
      setInvalidEmail("");
    } else if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setInvalidEmail(trimmedEmail);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const newEmails = emails.filter((email) => email !== emailToRemove);
    setEmails(newEmails);
    onEmailsChange?.(newEmails);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInvalidEmail("");

    if (value.includes(",")) {
      const emailParts = value.split(",");
      const emailToAdd = emailParts[0] as string;
      const remainingText = emailParts.slice(1).join(",");

      if (emailToAdd.trim()) {
        addEmail(emailToAdd);
      }
      setInputValue(remainingText);
    } else {
      setInputValue(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      e.preventDefault();
      const lastEmail = emails[emails.length - 1] as string;
      const newEmails = emails.slice(0, -1);
      setEmails(newEmails);
      onEmailsChange?.(newEmails);
      setInputValue(lastEmail.slice(0, -1));
    }
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2 py-0.5 px-2 border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[42px]">
        {emails.map((email, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-sm bg-secondary text-secondary-foreground"
          >
            <span>{email}</span>
            <button
              type="button"
              onClick={() => removeEmail(email)}
              className="hover:bg-secondary/80 rounded-sm p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          placeholder={emails.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-[120px]"
        />
      </div>

      {invalidEmail && (
        <p className="text-sm text-destructive">
          &quot;{invalidEmail}&quot; is not a valid email address
        </p>
      )}
    </div>
  );
}
