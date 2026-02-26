"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { useForm } from "react-hook-form"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"

type jobFormValues = {
  title: string
  description: string
  location: string
  employmentType: "full_time" | "part_time" | "contract" | "internship" | "temporary"
  workplaceType: "on_site" | "remote" | "hybrid"
  salaryMin: string
  salaryMax: string
  salaryCurrency: string
  tags: string
  autoCloseOnAccept: boolean
}

export default function NewCompanyJobPage() {
  const router = useRouter()
  const { orgId } = useAuth()
  const [statusText, setStatusText] = useState<string | null>(null)

  const companyContext = useQuery(
    api.companies.getMyCompanyContext,
    orgId ? { clerkOrgId: orgId } : "skip"
  )
  const usage = useQuery(
    api.companies.getCompanyUsage,
    companyContext ? { companyId: companyContext.companyId } : "skip"
  )
  const createJobListing = useMutation(api.jobs.createJobListing)

  const jobLimit = companyContext?.jobLimit ?? 1
  const atJobLimit = 
    usage !== undefined &&
    usage !== null && 
    usage.activeJobCount >= jobLimit

  const form = useForm<JobFormValue>({
    defaultValues: {
      title: "",
      description: "",
      location: "",
      employmentType: "full_time",
      workplaceType: "hybrid",
      salaryMin: "",
      salaryMax: "",
      salaryCurrency: "USD",
      tags: "",
      autoCloseOnAccept: false
    }
  })

  if (!orgId) {
    return (
      <Card className="warm-shadow">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Select an organization to continue.
        </CardContent>
      </Card>
    )
  }

  if (companyContext === undefined) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
    )
  }

  if (!companyContext) {
    return (
      <Card className="warm-shadow">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Your organization has not synced yet. Wait a few seconds and refresh.
        </CardContent>
      </Card>
    )
  }

  const canManage = companyContext.role === "admin" || companyContext.role === "recruiter"

  if(!canManage) {
    return (
      <Card className="warm-shadow">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="font-medium">Read-only access</p>
          <p className="text-sm text-muted-foreground">
            Only admins and recruiters can create job listings.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="animate-fade-in space-y-6">
      <Link
        href="/company/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to jobs
      </Link>

      <div>
        <h1 className="font-(family-name:var(--font-bricolage)) text-2xl font-bold tracking-tight">
          Post a new job
        </h1>
        <p className="mt-1 text-muted-foreground">
          This listing will be visible to candidates once published.
        </p>
      </div>

      {atJobLimit && (
        <Card className="border-amber-accent/30 bg-amber-accent/5">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-accent">
              Active job limit reached ({usage?.activeJobCount ?? 0}/{jobLimit})
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upgrade your plan or close a job to open a new listing.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/company/billing">Manage billing</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="@container warm-shadow">
        <CardContent className="p-4 @sm:p-6">
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(async values => {
                setStatusText(null)

                try {
                  await createJobListing({
                    companyId: companyContext.companyId,
                    title: values.title.trim(),
                    description: values.description.trim(),
                    location: values.location.trim(),
                    employmentType: values.employmentType,
                    workplaceType: values.workplaceType,
                    salaryMin: Number(values.salaryMin),
                    salaryMax: Number(values.salaryMax),
                    salaryCurrency: values.salaryCurrency.trim(),
                    tags: values.tags
                      .split(",")
                      .map(tag => tag.trim())
                      .filter(Boolean),
                    autoCloseOnAccept: values.autoCloseOnAccept
                  })
                  setStatusText("Job listing created.")
                  router.push("/company/jobs")
                } catch (error) {
                  setStatusText(getErrorMessage(error, "Could not create job listing."))
                }
              })}
            >
              <div className="space-y-4">
                <h3 className="font-(family-name:var(--font-bricolage)) text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Basics
                </h3>
                <FormField 
                  control={form.control}
                  name="title"
                  rules={{ required: "Title is required." }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior Product Designer" {...field} />
                      </FormControl>
                      <FormDescription>The role candidates will see in search.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField 
                  control={form.control}
                  name="description"
                  rules={{ required: "Description is required." }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <RichTextEditor 
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Role summary, requirements, responsibilities..."
                        />
                      </FormControl>
                      <FormDescription>Describe the role, team, and what you&apos;re looking for.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="font-(family-name:var(--font-bricolage)) text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Details
                </h3>
                <div className="grid gap-4 @xl:grid-cols-3">
                  <FormField 
                    control={form.control}
                    name="location"
                    rules={{ required: "Location is required." }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco, CA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField 
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment type</FormLabel>
                        <FormControl>
                          <select
                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                            {...field}
                          >
                            <option value="full_time">Full time</option>
                            <option value="part_time">Part time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                            <option value="temporary">Temporary</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField 
                    control={form.control}
                    name="workplaceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workplace type</FormLabel>
                        <FormControl>
                          <select
                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                            {...field}
                          >
                            <option value="on_site">On site</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="remote">Remote</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 @xl:grid-cols-3">
                  <FormField 
                    control={form.control}
                    name="salaryMin"
                    rules={{ required: "Minimum salary is required. "}}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary min</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" placeholder="120000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField 
                    control={form.control}
                    name="salaryMax"
                    rules={{ required: "Maximum salary is required." }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary max</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" placeholder="160000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField 
                    control={form.control}
                    name="salaryCurrency"
                    rules={{ required: "Currency is required. "}}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input placeholder="USD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField 
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input className="typescript, design, saas" {...field} />
                      </FormControl>
                      <FormDescription>Comma-separated tags to help candidates find this listing.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="font-(family-name:var(--font-bricolage)) text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Settings
                </h3>
                <FormField 
                  control={form.control}
                  name="autoCloseOnAccept"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={checked => field.onChange(!!checked)}
                        />
                      </FormControl>
                      <div>
                        <FormLabel>Auto-close after first accepted applicant</FormLabel>
                        <FormDescription>
                          Best for single-hire roles. Leave off if you need multiple hires.
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-3 border-t border-border pt-6">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || atJobLimit}
                  className="rounded-full bg-terracotta text-white hover:bg-terracotta/90"
                >
                  <Send className="mr-1.5 size-3.5" />
                  {form.formState.isSubmitting ? "Creating..." : "Publish listing"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => router.push("/company/jobs")}
                >
                  Cancel
                </Button>
                {statusText && <p className="text-xs text-muted-foreground">{statusText}</p>}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  )
}