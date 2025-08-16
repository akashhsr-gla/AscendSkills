"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface SecurityContextType {
  isSecure: boolean;
  violations: string[];
  addViolation: (violation: string) => void;
  clearViolations: () => void;
  securityLevel: 'low' | 'medium' | 'high';
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
  securityLevel?: 'low' | 'medium' | 'high';
  enableScreenshotPrevention?: boolean;
  enableKeyboardBlocking?: boolean;
  enableTabSwitchDetection?: boolean;
  enableCopyPastePrevention?: boolean;
  onSecurityViolation?: (violation: string) => void;
}

const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
  securityLevel = 'high',
  enableScreenshotPrevention = true,
  enableKeyboardBlocking = true,
  enableTabSwitchDetection = true,
  enableCopyPastePrevention = true,
  onSecurityViolation,
}) => {
  const [isSecure, setIsSecure] = useState(true);
  const [violations, setViolations] = useState<string[]>([]);
  const tabSwitchCount = useRef(0);
  const lastActiveTime = useRef(Date.now());

  const addViolation = (violation: string) => {
    setViolations(prev => [...prev, violation]);
    setIsSecure(false);
    onSecurityViolation?.(violation);
    console.warn('Security violation detected:', violation);
  };

  const clearViolations = () => {
    setViolations([]);
    setIsSecure(true);
  };

  // Screenshot prevention
  useEffect(() => {
    if (!enableScreenshotPrevention) return;

    const preventScreenshot = (e: KeyboardEvent) => {
      // Block screenshot combinations
      const screenshotCombos = [
        { key: 'PrintScreen' },
        { key: 's', ctrl: true, shift: true, cmd: true }, // Cmd+Shift+S (Mac)
        { key: 's', ctrl: true, shift: true }, // Ctrl+Shift+S
        { key: '3', ctrl: true, shift: true, cmd: true }, // Cmd+Shift+3 (Mac)
        { key: '4', ctrl: true, shift: true, cmd: true }, // Cmd+Shift+4 (Mac)
        { key: '5', ctrl: true, shift: true, cmd: true }, // Cmd+Shift+5 (Mac)
      ];

      for (const combo of screenshotCombos) {
        if (
          e.key === combo.key &&
          (!combo.ctrl || e.ctrlKey) &&
          (!combo.shift || e.shiftKey) &&
          (!combo.cmd || e.metaKey)
        ) {
          e.preventDefault();
          e.stopPropagation();
          addViolation('Screenshot attempt detected');
          return false;
        }
      }
    };

    document.addEventListener('keydown', preventScreenshot, true);
    document.addEventListener('keyup', preventScreenshot, true);

    return () => {
      document.removeEventListener('keydown', preventScreenshot, true);
      document.removeEventListener('keyup', preventScreenshot, true);
    };
  }, [enableScreenshotPrevention]);

  // Keyboard shortcut blocking
  useEffect(() => {
    if (!enableKeyboardBlocking) return;

    const blockKeyboardShortcuts = (e: KeyboardEvent) => {
      const blockedCombos = [
        // Developer tools
        { key: 'F12' },
        { key: 'I', ctrl: true, shift: true }, // Ctrl+Shift+I
        { key: 'J', ctrl: true, shift: true }, // Ctrl+Shift+J
        { key: 'C', ctrl: true, shift: true }, // Ctrl+Shift+C
        { key: 'U', ctrl: true }, // Ctrl+U (view source)
        
        // Copy/Paste (if enabled)
        ...(enableCopyPastePrevention ? [
          { key: 'c', ctrl: true }, // Ctrl+C
          { key: 'v', ctrl: true }, // Ctrl+V
          { key: 'x', ctrl: true }, // Ctrl+X
          { key: 'a', ctrl: true }, // Ctrl+A
          { key: 'c', cmd: true }, // Cmd+C (Mac)
          { key: 'v', cmd: true }, // Cmd+V (Mac)
          { key: 'x', cmd: true }, // Cmd+X (Mac)
          { key: 'a', cmd: true }, // Cmd+A (Mac)
        ] : []),
        
        // Refresh
        { key: 'F5' },
        { key: 'r', ctrl: true }, // Ctrl+R
        { key: 'r', cmd: true }, // Cmd+R (Mac)
        
        // New tab/window
        { key: 't', ctrl: true }, // Ctrl+T
        { key: 'n', ctrl: true }, // Ctrl+N
        { key: 't', cmd: true }, // Cmd+T (Mac)
        { key: 'n', cmd: true }, // Cmd+N (Mac)
        
        // Switch tabs
        { key: 'Tab', ctrl: true }, // Ctrl+Tab
        { key: 'Tab', cmd: true }, // Cmd+Tab (Mac)
        
        // Alt+Tab
        { key: 'Tab', alt: true },
      ];

      for (const combo of blockedCombos) {
        if (
          e.key === combo.key &&
          (!combo.ctrl || e.ctrlKey) &&
          (!combo.shift || e.shiftKey) &&
          (!combo.alt || e.altKey) &&
          (!combo.cmd || e.metaKey)
        ) {
          e.preventDefault();
          e.stopPropagation();
          addViolation(`Blocked keyboard shortcut: ${e.key}`);
          return false;
        }
      }
    };

    document.addEventListener('keydown', blockKeyboardShortcuts, true);

    return () => {
      document.removeEventListener('keydown', blockKeyboardShortcuts, true);
    };
  }, [enableKeyboardBlocking, enableCopyPastePrevention]);

  // Tab switch detection
  useEffect(() => {
    if (!enableTabSwitchDetection) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        addViolation(`Tab/window switch detected (${tabSwitchCount.current})`);
      }
      lastActiveTime.current = Date.now();
    };

    const handleWindowBlur = () => {
      addViolation('Window lost focus - possible tab switch or external application access');
    };

    const handleWindowFocus = () => {
      const timeDiff = Date.now() - lastActiveTime.current;
      if (timeDiff > 3000) { // More than 3 seconds away
        addViolation(`Window regained focus after ${Math.round(timeDiff / 1000)}s absence`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [enableTabSwitchDetection]);

  // Right-click context menu prevention
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation('Right-click context menu blocked');
      return false;
    };

    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  // Text selection prevention (optional - can be intrusive)
  useEffect(() => {
    if (securityLevel !== 'high') return;

    const preventSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('dragstart', preventSelection);

    return () => {
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('dragstart', preventSelection);
    };
  }, [securityLevel]);

  // Disable browser developer tools detection
  useEffect(() => {
    let devtools = { open: false, orientation: null };
    const threshold = 160;

    const detectDevTools = () => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          addViolation('Developer tools detected as open');
        }
      } else {
        devtools.open = false;
      }
    };

    const detectInterval = setInterval(detectDevTools, 500);

    return () => {
      clearInterval(detectInterval);
    };
  }, []);

  // Console warning
  useEffect(() => {
    const consoleWarning = () => {
      console.clear();
      console.log(
        '%cSTOP!',
        'color: red; font-size: 50px; font-weight: bold;'
      );
      console.log(
        '%cThis is a browser feature intended for developers. Using this console may compromise your interview session.',
        'color: red; font-size: 16px;'
      );
    };

    consoleWarning();
    
    // Clear console periodically
    const consoleInterval = setInterval(consoleWarning, 10000);

    return () => {
      clearInterval(consoleInterval);
    };
  }, []);

  const contextValue: SecurityContextType = {
    isSecure,
    violations,
    addViolation,
    clearViolations,
    securityLevel,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      <div 
        style={{ 
          userSelect: securityLevel === 'high' ? 'none' : 'auto',
          WebkitUserSelect: securityLevel === 'high' ? 'none' : 'auto',
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {children}
      </div>
      
      {/* Overlay to prevent right-click and other interactions */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          backgroundColor: 'transparent',
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </SecurityContext.Provider>
  );
};

export default SecurityProvider; 