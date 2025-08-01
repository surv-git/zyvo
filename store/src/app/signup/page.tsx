import { SignupForm } from "@/components/signup-form"
import { GuestGuard } from "@/components/auth-guard"

export default function Page() {
  return (
    <GuestGuard>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </GuestGuard>
  )
}
