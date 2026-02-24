import { SignIn } from "@clerk/nextjs"
import { SiteLogo } from "@/components/site-logo"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="animate-slide-up mb-8 flex flex-col items-center gap-3 text-center">
        <SiteLogo />
        <p className="text-sm text-muted-foreground">
          Welcome back - sign in to continue
        </p>
      </div>
      <div className="animate-slide-up stagger-2">
        <SignIn />
      </div>
    </main>
  )
}