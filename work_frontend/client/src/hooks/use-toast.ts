"use client"

import * as React from "react"
// import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000
export interface ToastProps {
  title?: string | React.ReactNode
  description?: string | React.ReactNode
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  onOpenChange?: (open: boolean) => void
}

export type ToastActionElement = React.ReactNode

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
}

type ToastActionType = "ADD_TOAST" | "UPDATE_TOAST" | "DISMISS_TOAST" | "REMOVE_TOAST"

type ToastAction =
  | {
      type: "ADD_TOAST"
      toast: ToasterToast
    }
  | {
      type: "UPDATE_TOAST"
      toast: Partial<ToasterToast>
    }
  | {
      type: "DISMISS_TOAST"
      toastId?: string
    }
  | {
      type: "REMOVE_TOAST"
      toastId?: string
    }

interface ToastState {
  toasts: ToasterToast[]
}

let toastCount = 0
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

// Generate unique toast ID
function generateToastId(): string {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER
  return toastCount.toString()
}

// Add toast to removal queue
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === toastId || toastId === undefined ? { ...t, open: false } : t)),
      }
    }

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }

    default:
      return state
  }
}

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type ToastInput = Omit<ToasterToast, "id">

function toast(input: ToastInput) {
  const id = generateToastId()

  const update = (props: Partial<ToasterToast>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...input,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return { id, dismiss, update }
}

toast.success = (title: string, description?: string) => {
  return toast({
    title,
    description,
    variant: "default",
  })
}

toast.error = (title: string, description?: string) => {
  return toast({
    title,
    description,
    variant: "destructive",
  })
}

toast.info = (title: string, description?: string) => {
  return toast({
    title,
    description,
    variant: "default",
  })
}

toast.warning = (title: string, description?: string) => {
  return toast({
    title,
    description,
    variant: "default",
  })
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId?: string) => {
      dispatch({ type: "DISMISS_TOAST", toastId })
    },
  }
}

export { useToast, toast }
