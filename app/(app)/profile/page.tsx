"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { useForm } from "react-hook-form"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { getErrorMessage } from "@/lib/convex-error"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RichTextDisplay } from "@/components/rich-text-display"
import { 
  Award,
  Briefcase,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Globe,
  Linkedin,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X
} from "lucide-react"
import Image from "next/image"

type ProfileFormValues = {
  firstName: string
  lastName: string
  headline: string
  bio: string
  summary: string
  location: string
  phone: string
  website: string
  linkedinUrl: string
  githubUrl: string
  yearsExperience: string
  skills: string
  openToWork: boolean
}

type ExperienceFormValues = {
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
}

type EducationFormValues = {
  school: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  description: string
}

type CertificationFormValues = {
  name: string
  issuingOrg: string
  issueDate: string
  expirationDate: string
  credentialUrl: string
}

function FileIcon({ contentType }: { contentType?: string | null }) {
  if (contentType?.startsWith("image/")) {
    return <FileText className="size-4" />
  }
  return <FileText className="size-4" />
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

function FileDropZone({
  onUpload,
  disabled
}: {
  onUpload: (file: File) => Promise<void>
  disabled?: boolean
}) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File exceeds the 10 MB limit.")
      return
    }
    setUploading(true)
    try {
      await onUpload(file)
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed."))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onDragOver={e => {
        e.preventDefault()
        if (!disabled && !uploading) {
          setDragOver(true)
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        if (disabled || uploading) {
          return
        }
        const file = e.dataTransfer.files[0]
        if (file) {
          void handleFile(file)
        }
      }}
      className={`relative flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? "border-jade bg-jade/5"
            : disabled
              ? "border-border/50 bg-secondary/20 opacity-60"
              : "border-border hover:border-jade/40 hover:bg-jade/5"
        }`}
    >
      {uploading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-jade border-t-transparent" />
          Uploading...
        </div>
      ) : (
        <>
          <div className="flex size-10 items-center justify-center rounded-full bg-jade/10 text-jade">
            <Plus className="size-5" />
          </div>
          <p className="text-sm font-medium">
            {disabled ? "File limit reached" : "Drop a file here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, images, or any file up to 10 MB
          </p>
          {!disabled && (
            <input 
              type="file"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleFile(file)
                }
                e.target.value = ""
              }}
            />
          )}
        </>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

function ExperienceCard({
  title,
  company,
  location,
  startDate,
  endDate,
  isCurrent,
  description,
  onEdit,
  onDelete
}: {
  title: string
  company: string
  location?: string | null
  startDate: string
  endDate?: string | null
  isCurrent: boolean
  description?: string | null
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-secondary/20 p-4 transition-colors hover:bg-secondary/40">
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} className="rounded-md p-1 hover:bg-secondary">
          <Pencil className="size-3.5 text-muted-foreground" />
        </button>
        <button onClick={onDelete} className="rounded-md p-1 hover:bg-destructive/10">
          <Trash2 className="size-3.5 text-destructive" />
        </button>
      </div>
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
          <Briefcase className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{company}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {startDate} - {isCurrent ? "Present" : (endDate ?? "")}
            {location && ` · ${location}`}
          </p>
          {description && (
            <RichTextDisplay content={description} className="mt-2" />
          )}
        </div>
      </div>
    </div>
  )
}

function ExperienceForm({
  initial,
  onSave,
  onCancel
}: {
  initial?: ExperienceFormValues
  onSave: (v: ExperienceFormValues) => Promise<void>
  onCancel: () => void
}) {
  const [values, setValues] = useState<ExperienceFormValues>(
    initial ?? {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: ""
    }
  )
  const [saving, setSaving] = useState(false)
  const set = (key: keyof ExperienceFormValues, val: string | boolean) => 
    setValues(prev => ({ ...prev, [key]: val }))

  return (
    <div className="@container space-y-3 rounded-xl border border-jade/30 bg-jade/5 p-4">
      <div className="grid gap-3 @xs:grid-cols-2">
        <Input 
          placeholder="Job title *"
          value={values.title}
          onChange={e => set("title", e.target.value)}
        />
        <Input 
          placeholder="Company *"
          value={values.company}
          onChange={e => set("company", e.target.value)}
        />
      </div>
      <Input 
        placeholder="Location"
        value={values.location}
        onChange={e => set("location", e.target.value)}
      />
      <div className="grid gap-3 @xs:grid-cols-2">
        <Input 
          placeholder="Start date (e.g. Jan 2022)"
          value={values.startDate}
          onChange={e => set("startDate", e.target.value)} 
        />
        <Input 
          placeholder="End date (or leave blank)"
          value={values.endDate}
          onChange={e => set("endDate", e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox 
          checked={values.isCurrent}
          onCheckedChange={c => {
            set("isCurrent", !!c)
            if (c) {
              set("endDate", "")
            }
          }} 
        />
        I currently work here
      </label>
      <Textarea 
        placeholder="Description (optional)"
        rows={3}
        value={values.description}
        onChange={e => set("description", e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="rounded-full bg-jade text-white hover:bg-jade/90"
          disabled={!values.title || !values.company || !values.startDate || saving}
          onClick={async () => {
            setSaving(true)
            await onSave(values)
            setSaving(false)
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={onCancel}
        >
          <X className="mr-1 size-3.5" /> Cancel
        </Button>
      </div>
    </div>
  )
}

function EducationCard({
  school,
  degree,
  fieldOfStudy,
  startDate,
  endDate,
  description,
  onEdit,
  onDelete
}: {
  school: string
  degree?: string | null
  fieldOfStudy?: string | null
  startDate?: string | null
  endDate?: string | null
  description?: string | null
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-secondary/20 p-4 transition-colors hover:bg-secondary/40">
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} className="rounded-md p-1 hover:bg-secondary">
          <Pencil className="size-3.5 text-destructive" />
        </button>
      </div>
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-jade/10 text-jade">
          <GraduationCap className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{school}</p>
          {(degree || fieldOfStudy) && (
            <p className="text-sm text-muted-foreground">
              {[degree, fieldOfStudy].filter(Boolean).join(", ")}
            </p>
          )}
          {(startDate || endDate) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[startDate, endDate].filter(Boolean).join(" - ")}
            </p>
          )}
          {description && (
            <RichTextDisplay content={description} className="mt-2" />
          )}
        </div>
      </div>
    </div>
  )
}

function EducationForm({
  initial,
  onSave,
  onCancel
}: {
  initial?: EducationFormValues
  onSave: (v: EducationFormValues) => Promise<void>
  onCancel: () => void
}) {
  const [values, setValues] = useState<EducationFormValues>(
    initial ?? { 
      school: "", 
      degree: "", 
      fieldOfStudy: "", 
      startDate: "", 
      endDate: "", 
      description: ""
    }
  )
  const [saving, setSaving] = useState(false)
  const set = (key: keyof EducationFormValues, val: string) => setValues(prev => ({ ...prev, [key]: val }))

  return (
    <div className="@container space-y-3 rounded-xl border border-jade/30 bg-jade/5 p-4">
      <Input 
        placeholder="School *"
        value={values.school}
        onChange={e => set("school", e.target.value)}
      />
      <div className="grid gap-3 @xs:grid-cols-2">
        <Input 
          placeholder="Degree (e.g. Bachelor's)"
          value={values.degree}
          onChange={e => set("degree", e.target.value)}
        />
        <Input 
          placeholder="Field of study"
          value={values.fieldOfStudy}
          onChange={e => set("fieldOfStudy", e.target.value)}
        />
      </div>
      <div className="grid gap-3- @xs:grid-cols-2">
        <Input 
          placeholder="Start year"
          value={values.startDate}
          onChange={e => set("startDate", e.target.value)}
        />
        <Input 
          placeholder="End year"
          value={values.endDate}
          onChange={e => set("endDate", e.target.value)}
        />
      </div>
      <Textarea 
        placeholder="Activities, honors, description (optional)"
        rows={2}
        value={values.description}
        onChange={e => set("description", e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="rounded-full bg-jade text-white hover:bg-jade/90"
          disabled={!values.school || saving}
          onClick={async () => {
            setSaving(true)
            await onSave(values)
            setSaving(false)
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="ghost" className="rounded-full" onClick={onCancel}>
          <X className="mr-1 size-3.5" /> Cancel
        </Button>
      </div>
    </div>
  )
}

function CertificationCard({
  name,
  issuingOrg,
  issueDate,
  expirationDate,
  credentialUrl,
  onEdit,
  onDelete
}: {
  name: string
  issuingOrg: string
  issueDate?: string | null
  expirationDate?: string | null
  credentialUrl?: string | null
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-secondary/20 p-4 transition-colors hover:bg-secondary/40">
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} className="rounded-md p-1 hover:bg-secondary">
          <Pencil className="size-3.5 text-muted-foreground" />
        </button>
        <button onClick={onDelete} className="rounded-md p-1 hover:bg-destructive/10">
          <Trash2 className="size-3.5 text-destructive" />
        </button>
      </div>
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-accent/10 text-amber-accent">
          <Award className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{issuingOrg}</p>
          {(issueDate || expirationDate) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {issueDate && `Issued ${issueDate}`}
              {expirationDate && ` · Expires ${expirationDate}`}
            </p>
          )}
          {credentialUrl && (
            <a
              href={credentialUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-jade hover:underline"
            >
              <ExternalLink className="size-3" />
              View credential
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function CertificationForm({
  initial,
  onSave,
  onCancel
}: {
  initial?: CertificationFormValues
  onSave: (v: CertificationFormValues) => Promise<void>
  onCancel: () => void
}) {
  const [values, setValues] = useState<CertificationFormValues>(
    initial ?? {
      name: "",
      issuingOrg: "",
      issueDate: "",
      expirationDate: "",
      credentialUrl: ""
    }
  )
  const [saving, setSaving] = useState(false)
  const set = (key: keyof CertificationFormValues, val: string) => setValues(prev => ({ ...prev, [key]: val }))

  return (
    <div className="@container space-y-3 rounded-xl border border-amber-accent/30 bg-amber-accent/5 p-4">
      <Input 
        placeholder="Certification name *"
        value={values.name}
        onChange={e => set("name", e.target.value)}
      />
      <Input 
        placeholder="Issuing organization *"
        value={values.issuingOrg}
        onChange={e => set("issuingOrg", e.target.value)}
      />
      <div className="grid gap-3 @xs:grid-cols-2">
        <Input 
          placeholder="Issue date"
          value={values.issueDate}
          onChange={e => set("issueDate", e.target.value)}
        />
        <Input 
          placeholder="Expiration date"
          value={values.expirationDate}
          onChange={e => set("expirationDate", e.target.value)}
        />
      </div>
      <Input 
        placeholder="Credential URL (optional)"
        value={values.credentialUrl}
        onChange={e => set("credentialUrl", e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="rounded-full bg-amber-accent text-white hover:bg-amber-accent/90"
          disabled={!values.name || !values.issuingOrg || saving}
          onClick={async () => {
            setSaving(true)
            await onSave(values)
            setSaving(false)
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={onCancel}
        >
          <X className="mr-1 size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user: clerkUser } = useUser()
  const profileBundle = useQuery(api.profiles.getMyProfile, {})
  const upsertMyProfile = useMutation(api.profiles.upsertMyProfile)
  const saveResume = useMutation(api.profiles.saveResume)
  const deleteResume = useMutation(api.profiles.deleteResume)
  const addExperience = useMutation(api.profiles.addExperience)
  const updateExperience = useMutation(api.profiles.updateExperience)
  const deleteExperience = useMutation(api.profiles.deleteExperience)
  const addEducation = useMutation(api.profiles.addEducation)
  const updateEducation = useMutation(api.profiles.updateEducation)
  const deleteEducation = useMutation(api.profiles.deleteEducation)
  const addCertification = useMutation(api.profiles.addCertification)
  const updateCertification = useMutation(api.profiles.updateCertification)
  const deleteCertification = useMutation(api.profiles.deleteCertification)

  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl)

  const [statusText, setStatusText] = useState<string | null>(null)
  const [formMounted, setFormMounted] = useState(false)

  useEffect(() => {
    setFormMounted(true)
  }, [])

  const [editingExperience, setEditingExperience] = useState<Id<"experiences"> | "new" | null>(null)
  const [editingEducation, setEditingEducation] = useState<Id<"education"> | "new" | null>(null)
  const [editingCertification, setEditingCertification] = useState<Id<"certifications"> | "new" | null>(null)

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      headline: "",
      bio: "",
      summary: "",
      location: "",
      phone: "",
      website: "",
      linkedinUrl: "",
      githubUrl: "",
      yearsExperience: "",
      skills: "",
      openToWork: true
    }
  })

  useEffect(() => {
    form.reset({
        firstName: profileBundle?.profile?.firstName ?? profileBundle?.user?.firstName ?? "",
        lastName: profileBundle?.profile?.lastName ?? profileBundle?.user?.lastName ?? "",
        headline: profileBundle?.profile?.headline ?? "",
        bio: profileBundle?.profile?.bio ?? "",
        summary: profileBundle?.profile?.summary ?? "",
        location: profileBundle?.profile?.location ?? "",
        phone: profileBundle?.profile?.phone ?? "",
        website: profileBundle?.profile?.website ?? "",
        linkedinUrl: profileBundle?.profile?.linkedinUrl ?? "",
        githubUrl: profileBundle?.profile?.githubUrl ?? "",
        yearsExperience:
          profileBundle?.profile?.yearsOfExperience !== undefined
            ? String(profileBundle.profile.yearsExperience)
            : "",
        skills: (profileBundle?.profile?.skills ?? []).join(", "),
        openToWork: profileBundle?.profile?.openToWork ?? true
      })
    }, [form, profileBundle])

  const profile = profileBundle?.profile
  const displayName = 
    [profile?.firstName, profile?.lastName].some(s => s != null && s.trim() !== "")
      ? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
      : `${profileBundle?.user?.firstName ?? ""} ${profileBundle?.user?.lastName ?? ""}.trim()`

  return (
    <section className="animate-fade-in space-y-6">
      <Card className="@container warm-shadow overflow-hidden">
        <div className="relative h-32 bg-linear-to-r from-jade/20 via-jade/10 to-terracotta/10">
          {profile?.openToWork && (
            <div className="absolute left-4 top-4">
              <Badge className="gap-1 rounded-full bg-jade/90 px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="size-3" />
                Open to work
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="relative pb-6 pt-0">
          <div className="mt-12 flex flex-col gap-4 @sm:flex-row @sm:items-end @sm:gap-6">
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-4 border-card bg-secondary text-2xl font-bold text-muted-foreground">
              {clerkUser?.imageUrl ? (
                <Image 
                  src={clerkUser.imageUrl}
                  alt=""
                  className="size-full rounded-full object-cover"
                />
              ) : (
                displayName?.[0]?.toUpperCase() ?? "?"
              )}
            </div>
            <div className="min-w-0 flex-1 pt-2">
              <h1 className="font-(family-name:--font-bricolage) text-2xl font-bold tracking-tight">
                {displayName || "Your name"}
              </h1>
              {profile?.headline && (
                <p className="mt-0.5 text-base text-muted-foreground">
                  {profile.headline}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {profile.location}
                  </span>
                )}
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {profile.phone}
                  </span>
                )}
                {profile?.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-jade hover:underline"
                  >
                    <Linkedin className="size-3.5" />
                    LinkedIn
                  </a>
                )}
                {profile?.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-jade hover:underline"
                  >
                    <Github className="size-3.5" />
                    GitHub
                  </a>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-jade hover:underline"
                  >
                    <Globe className="size-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="@container">
        <div className="grid gap-6 @5xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card className="warm-shadow">
              <CardHeader>
                <CardTitle className="font-(family-name:--font-bricolage) text-xl tracking-tight">
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!formMounted ? (
                  <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <Form {...form}>
                    <form
                      className="space-y-4"
                      onSubmit={form.handleSubmit(async values => {
                        setStatusText(null)
                        const years = values.yearsExperience?.trim() ?? ""
                        if (years && Number.isNaN(Number(years))) {
                          setStatusText("Years of experience must be a number.")
                          return
                        }
                        try {
                          await upsertMyProfile({
                            firstName: values.firstName?.trim() || undefined,
                            lastName: values.lastName?.trim() || undefined,
                            headline: values?.headline?.trim() || undefined,
                            bio: values.bio?.trim() || undefined,
                            summary: values.summary?.trim() || undefined,
                            location: values.location?.trim() || undefined,
                            phone: values.phone?.trim() || undefined,
                            website: values.website?.trim() || undefined,
                            linkedinUrl: values.linkedinUrl?.trim() || undefined,
                            githubUrl: values.githubUrl?.trim() || undefined,
                            yearsExperience: years ? Number(years) : undefined,
                            skills: values.skills
                              .split(",")
                              .map(s => s.trim())
                              .filter(Boolean),
                            openToWork: values.openToWork ?? true
                          })
                          setStatusText("Profile saved.")
                        } catch (error) {
                          setStatusText(getErrorMessage(error, "Could not save profile."))
                        }
                      })}
                    >
                      <div className="grid gap-4 @xs:grid-cols-2">
                        <FormField 
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your first name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField 
                          control={form.control}
                          name="lastName"
                          render={( { field }) => (
                            <FormItem>
                              <FormLabel>Last name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField 
                        control={form.control}
                        name="headline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Headline</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Senior Frontend Engineer" {...field} />
                            </FormControl>
                            <FormDescription>
                              A short title that describes what you do.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField 
                        control={form.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Summary</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={4}
                                placeholder="Write a compelling summary of your professional background, key achievements, and what you're looking for..."
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Your professional elevator pitch - recruiters see this first.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField 
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={3}
                                placeholder="A more personal note about your interests, passions, or what drives you..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 @xs:grid-cols-2">
                        <FormField 
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. San Francisco, CA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField 
                          control={form.control}
                          name="yearsExperience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years of experience</FormLabel>
                              <FormControl>
                                <Input 
                                  inputMode="numeric"
                                  placeholder="e.g. 5"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 @xs:grid-cols-2">
                        <FormField 
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField 
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Portfolio / Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yoursite.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 @xs:grid-cols-2">
                        <FormField 
                          control={form.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://linkedin.com/in/yourname" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField 
                          control={form.control}
                          name="githubUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Github URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://github.com/yourname" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField 
                        control={form.control}
                        name="skills"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skills</FormLabel>
                            <FormControl>
                              <Input placeholder="React, TypeScript, Product design" {...field} />
                            </FormControl>
                            <FormDescription>
                              Separate skills with commas.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField 
                        control={form.control}
                        name="openToWork"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                            <FormControl>
                              <Checkbox 
                                checked={field.value}
                                onCheckedChange={checked => field.onChange(!!checked)}
                              />
                            </FormControl>
                            <div>
                              <FormLabel>Open to work</FormLabel>
                              <FormDescription>
                                Let recruiters know you&apos;re available.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          type="submit"
                          className="rounded-full bg-jade text-white hover:bg-jade/90"
                        >
                          <Save className="mr-1.5 size-3.5" />
                          Save profile
                        </Button>
                        {statusText && (
                          <p className={`text-xs ${statusText.includes("saved") ? "text-jade" : "text-muted-foreground"}`}>
                            {statusText}
                          </p>
                        )}
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            <Card id="experience" className="warm-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-(family-name:--font-bricolage) text-xl tracking-tight">
                  <Briefcase className="size-5 text-terracotta" />
                  Experience
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setEditingExperience("new")}
                >
                  <Plus className="mr-1 size-3.5" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingExperience === "new" && (
                  <ExperienceForm 
                    onSave={async values => {
                      try {
                        await addExperience({
                          title: values.title,
                          company: values.company,
                          location: values.location || undefined,
                          startDate: values.startDate,
                          endDate: values.endDate || undefined,
                          isCurrent: values.isCurrent,
                          description: values.description || undefined
                        })
                        setEditingExperience(null)
                      } catch (error) {
                        toast.error(getErrorMessage(error, "Could not add experience."))
                      }
                    }}
                    onCancel={() => setEditingExperience(null)}
                  />
                )}

                {(profileBundle?.experiences ?? []).length === 0 && 
                  editingExperience !== "new" && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No experience added yet. Add your work history to stand out to recruiters.
                    </p>
                  )
                }

                {(profileBundle?.experiences ?? []).map(exp => 
                  editingExperience === exp._id ? (
                    <ExperienceForm 
                      key={exp._id}
                      initial={{
                        title: exp.title,
                        company: exp.company,
                        location: exp.location ?? "",
                        startDate: exp.startDate,
                        endDate: exp.endDate ?? "",
                        isCurrent: exp.isCurrent,
                        description: exp.description ?? ""
                      }}
                      onSave={async values => {
                        try {
                          await updateExperience({
                            experienceId: exp._id,
                            title: values.title,
                            company: values.company,
                            location: values.location || undefined,
                            startDate: values.startDate,
                            endDate: values.endDate || undefined,
                            isCurrent: values.isCurrent,
                            description: values.description || undefined
                          })
                          setEditingExperience(null)
                        } catch (error) {
                          toast.error(getErrorMessage(error, "Could not update experience."))
                        }
                      }}
                      onCancel={() => setEditingExperience(null)}
                    />
                  ) : (
                    <ExperienceCard 
                      key={exp._id}
                      title={exp.title}
                      company={exp.company}
                      location={exp.location}
                      startDate={exp.startDate}
                      endDate={exp.endDate}
                      isCurrent={exp.isCurrent}
                      description={exp.description}
                      onEdit={() => setEditingExperience(exp._id)}
                      onDelete={() => 
                        void deleteExperience({ experienceId: exp._id }).catch(error => 
                          toast.error(getErrorMessage(error, "Could not delete experience."))
                        )
                      }
                    />
                  )
                )}
              </CardContent>
            </Card>

            <Card className="warm-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-(family-name:--font-bricolage) text-xl tracking-tight">
                  <GraduationCap className="size-5 text-jade" />
                  Education
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setEditingEducation("new")}
                >
                  <Plus className="mr-1 size-3.5" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingEducation === "new" && (
                  <EducationForm 
                    onSave={async values => {
                      try {
                        await addEducation({
                          school: values.school,
                          degree: values.degree || undefined,
                          fieldOfStudy: values.fieldOfStudy || undefined,
                          startDate: values.startDate || undefined,
                          endDate: values.endDate || undefined,
                          description: values.description || undefined
                        })
                        setEditingEducation(null)
                      } catch (error) {
                        toast.error(getErrorMessage(error, "Could not add education."))
                      }
                    }}
                    onCancel={() => setEditingEducation(null)}
                  />
                )}

                {(profileBundle?.education ?? []).length === 0 && 
                  editingEducation !== "new" && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No education added yet.
                    </p>
                  )
                }

                {(profileBundle?.education ?? []).map(edu => 
                  editingEducation === edu._id ? (
                    <EducationForm 
                      key={edu._id}
                      initial={{
                        school: edu.school,
                        degree: edu.degree ?? "",
                        fieldOfStudy: edu.fieldOfStudy ?? "",
                        startDate: edu.startDate ?? "",
                        endDate: edu.endDate ?? "",
                        description: edu.description ?? ""
                      }}
                      onSave={async values => {
                        try {
                          await updateEducation({
                            educationId: edu._id,
                            school: values.school,
                            degree: values.degree || undefined,
                            fieldOfStudy: values.fieldOfStudy || undefined,
                            startDate: values.startDate || undefined,
                            endDate: values.endDate || undefined,
                            description: values.description || undefined
                          })
                          setEditingEducation(null)
                        } catch (error) {
                          toast.error(getErrorMessage(error, "Could not update education."))
                        }
                      }}
                      onCancel={() => setEditingEducation(null)}
                    />
                  ) : (
                    <EducationCard 
                      key={edu._id}
                      school={edu.school}
                      degree={edu.degree}
                      fieldOfStudy={edu.fieldOfStudy}
                      startDate={edu.startDate}
                      endDate={edu.endDate}
                      description={edu.description}
                      onEdit={() => setEditingEducation(edu._id)}
                      onDelete={() => 
                        void deleteEducation({ educationId: edu._id }).catch(error => 
                          toast.error(getErrorMessage(error, "Could not delete education."))
                        )
                      }
                    />
                  )
                )}
              </CardContent>
            </Card>

            <Card className="warm-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-(family-name:--font-bricolage) text-xl tracking-tight">
                  <Award className="size-5 text-amber-accent" />
                  Certifications
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setEditingCertification("new")}
                >
                  <Plus className="mr-1 size-3.5" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingCertification === "new" && (
                  <CertificationForm 
                    onSave={async values => {
                      try {
                        await addCertification({
                          name: values.name,
                          issuingOrg: values.issuingOrg,
                          issueDate: values.issueDate || undefined,
                          expirationDate: values.expirationDate || undefined,
                          credentialUrl: values.credentialUrl || undefined
                        })
                        setEditingCertification(null)
                      } catch (error) {
                        toast.error(getErrorMessage(error, "Could not add certification."))
                      }
                    }}
                    onCancel={() => setEditingCertification(null)}
                  />
                )}

                {(profileBundle?.certifications ?? []).length === 0 &&
                  editingCertification !== "new" && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No certifications added yet.
                    </p>
                  )
                }

                {(profileBundle?.certifications ?? []).map(cert => 
                  editingCertification === cert._id ? (
                    <CertificationForm 
                      key={cert._id}
                      initial={{
                        name: cert.name,
                        issuingOrg: cert.issuingOrg,
                        issueDate: cert.issueDate ?? "",
                        expirationDate: cert.expirationDate ?? "",
                        credentialUrl: cert.credentialUrl ?? ""
                      }}
                      onSave={async values => {
                        try {
                          await updateCertification({
                            certificationId: cert._id,
                            name: values.name,
                            issuingOrg: values.issuingOrg,
                            issueDate: values.issueDate || undefined,
                            expirationDate: values.expirationDate || undefined,
                            credentialUrl: values.credentialUrl || undefined
                          })
                          setEditingCertification(null)
                        } catch (error) {
                          toast.error(getErrorMessage(error, "Could not update certification."))
                        }
                      }}
                      onCancel={() => setEditingCertification(null)}
                    />
                  ) : (
                    <CertificationCard 
                      key={cert._id}
                      name={cert.name}
                      issuingOrg={cert.issuingOrg}
                      issueDate={cert.issueDate}
                      expirationDate={cert.expirationDate}
                      credentialUrl={cert.credentialUrl}
                      onEdit={() => setEditingCertification(cert._id)}
                      onDelete={() => 
                        void deleteCertification({ certificationId: cert._id }).catch(error => 
                          toast.error(getErrorMessage(error, "Could not delete certification."))
                        )
                      }
                    />
                  )
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {(profile?.skills ?? []).length > 0 && (
              <Card className="warm-shadow">
                <CardHeader>
                  <CardTitle className="font-(family-name:--font-bricolage) text-lg tracking-tight">
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.skills ?? []).map(skill => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="rounded-full border-jade/20 bg-jade/5 px-3 py-1 text-xs font-medium text-jade"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="warm-shadow">
              <CardHeader>
                <CardTitle className="font-(family-name:--font-bricolage) text-lg tracking-tight">
                  At a glance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium">
                    {profile?.yearsExperience !== null
                      ? `${profile.yearsExperience} years`
                      : "-"
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Roles listed</span>
                  <span className="font-medium">
                    {profileBundle?.experience?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Education</span>
                  <span className="font-medium">
                    {profileBundle?.education?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Certifications</span>
                  <span className="font-medium">
                    {profileBundle?.certifications?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium">
                    {profileBundle?.resumes?.length ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card id="resume" className="warm-shadow">
              <CardHeader>
                <CardTitle className="font-(family-name:--font-bricolage) text-lg tracking-tight">
                  Resume &amp; Resources
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Upload your resume, portfolio, or any files to share with recruiters. Max 10 MB per file, up to 10 files.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileDropZone 
                  onUpload={async file => {
                    const uploadUrl = await generateUploadUrl()
                    const res = await fetch(uploadUrl, {
                      method: "POST",
                      headers: { "Content-Type": file.type || "application/octet-stream"},
                      body: file
                    })
                    if (!res.ok) {
                      throw new Error("Upload failed")
                    }
                    const { storageId } = (await res.json()) as { storageId: string }
                    const title = file.name.replace(/\.[^.]+$/, "")
                    await saveResume({
                      title,
                      storageId: storageId as Id<"_storage">,
                      fileName: file.name,
                      fileSize: file.size,
                      contentType: file.type || undefined
                    })
                  }}
                  disabled={(profileBundle?.resumes?.length ?? 0) > 10}
                />

                {(profileBundle?.resumes ?? []).length === 0 && (
                  <p className="py-1 text-center text-xs text-muted-foreground">
                    No files uploaded yet.
                  </p>
                )}

                {(profileBundle?.resumes ?? []).map(resume => (
                  <div
                    key={resume._id}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-jade/10 text-jade">
                        <FileIcon contentType={resume.contentType} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {resume.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {resume.fileName}
                          {resume.fileSize != null && ` · ${formatFileSize(resume.fileSize)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {resume.fileUrl && (
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="size-8 rounded-full p-0"
                        >
                          <a
                            href={resume.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Download file"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 rounded-full p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => 
                          void deleteResume({ resumeId: resume._id }).catch(error => 
                            toast.error(getErrorMessage(error, "Could not delete file."))
                          )
                        }
                        aria-label="Delete file"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}