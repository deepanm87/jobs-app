"use client"

import { useState } from "react"
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
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type NotificationType = 
  | "application_status"
  | "application_received"
  | "job_closed"
  | "system"

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
    return `${hours}h ago`
  }
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }
  return new Date(timestamp).toLocaleDateString()
}

function getNotificationIcon(
  type: NotificationType,
  metadata?: Record<string, unknown>
) {
  switch (type) {
    case "application_status": {
      const status = metadata?.status as string | undefined
      if (status === "accepted") {
        return <CheckCheck className="size-5 text-emerald-500" />
      }
      if (status === "rejected") {
        return <XCircle className="size-5 text-red-400" />
      }
      return <FileText className="size-5 text-amber-500" />
    }
    case "application_received":
      return <FileText className="size-5 text-blue-500" />
    case "job_closed":
      return <BriefcaseBusiness className="size-5 text-muted-foreground" />
    case "system":
    default:
      return <Info className="size-5 text-muted-foreground" />
  }
}

function getIconBg(type: NotificationType, metadata?: Record<string, unknown>) {
  switch(type) {
    case "application_status": {
      const status = metadata?.status as string | undefined
      if (status === "accepted") {
        return "bg-emerald-500/10"
      }
      if (status === "rejected") {
        return "bg-red-400/10"
      }
      return "bg-amber-500/10"
    }
    case "application_received":
      return "bg-blue-500/10"
    case "job_closed":
      return "bg-muted"
    case "system":
    default:
      return "bg-muted"
  }
}

type Filter = "all" | "unread"

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")

  const notifications = useQuery(api.notifications.listMyNotifications, {
    limit: 200,
    unreadOnly: filter === "unread"
  })
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount) ?? 0
  const markRead = useMutation(api.notifications.markNotificationRead)
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead)

  const handleClick = async (
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
      router.push(linkUrl)
    }
  }

  return (
    <section className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--font-bricolage) text-2xl font-bold tracking-tight">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated on your applications and job activity.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => 
              void markAllRead().catch(error => 
                toast.error(getErrorMessage(error, "Could not mark all as read."))
              )
            }
            className="shrink-0 rounded-full text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-1">
        {(["all", "unread"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-jade text-white"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
          >
            {tab === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : "" }`}
          </button>
        ))}
      </div>

      {notifications === undefined && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-secondary"
            />
          ))}
        </div>
      )}

      {notifications?.length === 0 && (
        <Card className="warm-shadow">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-jade/10">
              <Bell className="size-5 text-jade" />
            </div>
            <p className="font-medium">
              {filter === "unread"
                ? "All caught up!"
                : "No notifications yet"
              }
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {filter === "unread"
                ? "You have no unread notifications. Nice work keeping things tidy."
                : "When there's activity on your applications or saved jobs, it'll show up here."
              }
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {notifications?.map((notification, index) => {
          const meta = notification.metadata as
            | Record<string, unknown>
            | undefined
          const type = notification.type as NotificationType
          return (
            <button
              key={notification._id}
              onClick={() =>
                handleClick(
                  notification._id,
                  notification.linkUrl,
                  notification.isRead
                )
              }
              className={`animate-slide-up flex w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition-all hover:warm-shadow ${
                !notification.isRead
                  ? "border-jade/20 bg-jade/3"
                  : "border-border/40 bg-background"
                }`}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${getIconBg(type, meta)}`}>
                {getNotificationIcon(type, meta)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm leading-snug ${
                      !notification.isRead
                        ? "font-semibold"
                        : "font-medium text-foreground/80"
                      }`}
                  >
                    {notification.title}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] text-muted-foreground/60">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <span className="size-2 rounded-full bg-jade" />
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                  {notification.message}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}