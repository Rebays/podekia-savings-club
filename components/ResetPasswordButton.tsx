"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { KeyRound } from "lucide-react"

interface Props {
  memberId: string
  email: string
  fullName?: string | null
}

export function ResetPasswordButton({ memberId, email, fullName }: Props) {
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  console.log("ResetPasswordButton props:", { memberId, email, fullName })
  const generateLink = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      setResetLink(data.link)
      toast.success("Reset link generated")
    } catch (err: any) {
      toast.error("Error", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 text-orange-500 hover:text-orange-600">
          <KeyRound className="h-4 w-4" />
          Reset Password
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Password for {fullName || email}</AlertDialogTitle>
          <AlertDialogDescription>
            This will generate a secure one-time reset link. Copy and send it to the member.
            The link expires in 1 hour.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-muted rounded-md break-all text-sm min-h-20 flex items-center justify-center">
          {resetLink ? (
            <div className="w-full space-y-2">
              <p className="font-medium">Reset Link:</p>
              <p className="text-primary wrap-break-words">{resetLink}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(resetLink)
                  toast.success("Copied to clipboard")
                }}
              >
                Copy Link
              </Button>
            </div>
          ) : (
            <Button onClick={generateLink} disabled={loading}>
              {loading ? "Generating..." : "Generate Reset Link"}
            </Button>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setResetLink(null)}>
            Close
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}