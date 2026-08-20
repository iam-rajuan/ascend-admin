"use client";

import { useState, useEffect, useCallback } from "react";

interface ToastState {
  show: boolean;
  message: string;
}

export function useToast(defaultTimeout = 3000) {
  const [state, setState] = useState<ToastState>({ show: false, message: "" });

  const triggerToast = useCallback(
    (msg: string, timeout = defaultTimeout) => {
      setState({ show: true, message: msg });
      setTimeout(() => setState({ show: false, message: "" }), timeout);
    },
    [defaultTimeout],
  );

  return {
    show: state.show,
    message: state.message,
    triggerToast,
  };
}
