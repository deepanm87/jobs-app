import { SignUp } from "@clerk/nextjs"
import { SiteLogo } from "@/components/site-logo"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="animate-slide-up mb-8 flex flex-col items-center gap-3 text-center">
        <SiteLogo />
        <p className="text-sm text-muted-foreground">
          Join JobsApp - it takes less than a minute
        </p>
      </div>
      <div className="animate-slide-up stagger-2">
        <SignUp />
      </div>
    </div>
  )
}