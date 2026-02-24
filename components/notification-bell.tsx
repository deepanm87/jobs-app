"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  FileText,
  Info,
  XCircle
} from "lucide-react"
import { useEffect, useState } from "react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { toast } from "sonner" 
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

function formatRelativeTime(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) {
    return "just now"
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }
  return new Date(timestamp).toLocaleDateString()
}

type NotificationType = 
  | "application_status"
  | "application_received"
  | "job_closed"
  | "system"

function getNotificationIcon(type: NotificationType, metadata?: Record<string, unknown>) {
  switch (type) {
    case "application_status": {
      const status = metadata?.status as string | undefined
      if (status === "accepted") {
        return <CheckCheck className="size-4 text-emerald-500" />
      }
      if (status === "rejected") {
        return <XCircle className="size-4 text-red-400" />
      }
      return <FileText className="size-4 text-amber-500" />
    }
    case "application_received":
      return <FileText className="size-4 text-blue-500" />
    case "job_closed":
      return <BriefcaseBusiness className="size-4 text-muted-foreground" />
    case "system":
    default:
      return <Info className="size-4 text-muted-foreground" />
  }
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount) ?? 0
  const notifications = useQuery(api.notifications.listMyNotifications, {
    limit: 10
  })
  const markRead = useMutation(api.notifications.markNotificationRead)
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead)

  const handleNotificationClick = async (
    notificationId: Id<"notifications">,
    linkUrl?: string,
    isRead?: boolean
  ) => {
    try {
      if (!isRead) {
        await markRead({ notificationId })
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not mark notification as read."))
    }
    if (linkUrl) {
      setOpen(false)
      router.push(linkUrl)
    }
  }

  const displayCount = unreadCount > 9 ? "9+" : unreadCount

  if (!mounted) {
    return (
      <button
        type="button"
        className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
      </button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={`Notifications${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-jade text-[9px] font-bold text-white">
              {displayCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => 
                void markAllRead().catch(error => 
                  toast.error(getErrorMessage(error, "Could not mark all as read."))
                )
              }
              className="text-xs text-muted-foreground"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-8 text-center">
              <Bell className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map(notification => (
              <button
                key={notification._id}
                onClick={() => 
                  handleNotificationClick(
                    notification._id,
                    notification.linkUrl,
                    notification.isRead
                  )
                }
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${
                    !notification.isRead ? "bg-jade/5" : ""
                  }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getNotificationIcon(
                    notification.type as NotificationType,
                    notification.metadata as Record<string, unknown> | undefined
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${
                      !notification.isRead ? "font-semibold" : "font-medium"
                    }`}
                    >
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-ful bg-jade" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/60">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {notifications && notifications.length > 0 && (
          <div className="border-t border-border/60">
            <button
              onClick={() => {
                setOpen(false)
                router.push("/notifications")
              }}
              className="flex w-full items-center justify-center py-2.5 text-xs font-medium text-jade transition-colors hover:bg-secondary/50"
            >
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}