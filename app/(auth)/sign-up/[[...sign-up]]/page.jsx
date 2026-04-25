import { SignUp } from '@clerk/nextjs'
import { isClerkEnabled } from '@/lib/clerk'

export default function Page() {
  if (!isClerkEnabled) {
    return <div className="p-6 text-sm text-gray-600">Clerk is not configured. Add keys in `.env.local`.</div>
  }

  return <SignUp />
}