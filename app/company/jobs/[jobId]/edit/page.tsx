"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { useForm } from "react-hook-form"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/rich-text-editor"

type JobFormValue = {
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

export default function EditCompanyJobPage() {
  const router = useRouter()
  const params = useParams<{ jobId: string}>()
  const jobId = params.jobId as Id<"jobListings">
  const { orgId } = useAuth()
  const [statusText, setStatusText] = useState<string | null>(null)

  const companyContext = useQuery(
    api.companies.getMyCompanyContext,
    orgId ? { clerkOrgId: orgId } : "skip"
  )
  const job = useQuery(api.jobs.getJobListingById, { jobId })
  const updateJobListing = useMutation(api.jobs.updateJobListing)

  const form = useForm<JobFormValues>({
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

  useEffect(() => {
    if (!job) {
      return
    }
    form.reset({
      title: job.title,
      description: job.description,
      location: job.location,
      employmentType: job.employmentType,
      workplaceType: job.workplaceType,
      salaryMin: job.salaryMin !== undefined ?  String(job.salaryMin) : "",
      salaryMax: job.salaryMax !== undefined ? String(job.salaryMax) : "",
      tags: job.tags.join(", "),
      autoCloseOnAccept: job.autoCloseOnAccept ?? false
    })
  }, [form, job])

  if (!orgId) {
    return <p className="text-sm text-muted-foreground">Select an organization to continue.</p>
  }

  if (companyContext === undefined || job === undefined) {
    return <p className="text-sm text-muted-foreground">Loading job listing...</p>
  }

  if (!companyContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company workspace unavailable</CardTitle>
          <CardDescription>
            Your organization has not synced yet. Wait a few seconds and refresh.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!job || job.companyId !== companyContext.companyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Listing not found</CardTitle>
          <CardDescription>
            This listing does not belong to your current organization.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canManage = companyContext.role === "admin" || companyContext.role === "recruiter"

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Read-only access</CardTitle>
          <CardDescription>
            Only admins and recruiters can edit job listings.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Edit job listing</h2>
        <p className="text-sm text-muted-foreground">
          Update posting details, compensation, tags, and auto-close behavior.
        </p>
      </header>

      <Card className="@container">
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async values => {
                setStatusText(null)
                const salaryMin = values.salaryMin.trim()
                const salaryMax = values.salaryMax.trim()

                try {
                  await updateJobListing({
                    companyId: companyContext.companyId,
                    jobId,
                    title: values.title.trim(),
                    description: values.description.trim(),
                    location: values.location.trim(),
                    employmentType: values.employmentType,
                    workplaceType: values.workplaceType,
                    salaryMin: salaryMin ? Number(salaryMin) : undefined,
                    salaryMax: salaryMax ? Number(salaryMax) :  undefined,
                    tags: values.tags
                      .split(",")
                      .map(tag => tag.trim())
                      .filter(Boolean),
                    autoCloseOnAccept: values.autoCloseOnAccept
                  })
                  setStatusText("Job listing updated.")
                  router.push("/company/jobs")
                } catch (error) {
                  setStatusText(getErrorMessage(error, "Could not update job listing."))
                }
              })}
            >
              <FormField 
                control={form.control}
                name="title"
                rules={{ required: "Title is required. "}}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 @xl:grid-cols-3">
                <FormField 
                  control={form.control}
                  name="location"
                  rules={{  required: "Location is required. "}}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
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
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
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

              <div className="grid gap-3 @xl:grid-cols-3">
                <FormField 
                  control={form.control}
                  name="salaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary min</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField 
                  control={form.control}
                  name="salaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary max</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField 
                  control={form.control}
                  name="salaryCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control}
                name="autoCloseOnAccept"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 rounded-md border p-3">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={checked => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel>AUto-close listing after first accepted applicant</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Enable for single-hire roles. Leave off if you need multiple hires.
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/company/jobs")}
                >
                  Cancel
                </Button>
              </div>
              {statusText ? <p className="text-xs text-muted-foreground">{statusText}</p> : null}
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  )
}