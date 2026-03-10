'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface NavbarOverlayDropdownProps {
  isOpen: boolean;
  isClosing?: boolean;
  panelRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  backdropClassName?: string;
  ariaLabel: string;
  onBackdropClick: () => void;
  children: React.ReactNode;
}

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export function NavbarOverlayDropdown({
  isOpen,
  isClosing = false,
  panelRef,
  className,
  backdropClassName,
  ariaLabel,
  onBackdropClick,
  children,
}: NavbarOverlayDropdownProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={joinClasses(
          'dropdown-backdrop notification-dropdown-backdrop',
          isClosing ? 'is-closing' : 'is-open',
          backdropClassName
        )}
        onClick={onBackdropClick}
      />

      <div
        ref={panelRef}
        className={joinClasses(
          'notification-dropdown',
          isClosing ? 'is-closing' : 'is-open',
          className
        )}
        role="dialog"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </>,
    document.body
  );
}
