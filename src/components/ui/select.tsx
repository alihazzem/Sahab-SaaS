'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function Select({
    value,
    onValueChange,
    options,
    placeholder = "Select an option",
    className = "",
    disabled = false
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close dropdown on escape key
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => {
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isOpen]);

    const selectedOption = options.find(option => option.value === value);

    const handleSelect = (optionValue: string) => {
        onValueChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)} ref={selectRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md shadow-sm transition-colors",
                    "hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "flex items-center justify-between",
                    isOpen && "border-primary ring-1 ring-primary/20"
                )}
            >
                <span className={cn(
                    "block truncate",
                    !selectedOption && "text-muted-foreground"
                )}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                    <div className="max-h-60 overflow-auto py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "w-full px-3 py-2 text-sm text-left transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                                    "flex items-center justify-between",
                                    value === option.value && "bg-accent text-accent-foreground"
                                )}
                            >
                                <span>{option.label}</span>
                                {value === option.value && (
                                    <Check className="h-4 w-4" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}