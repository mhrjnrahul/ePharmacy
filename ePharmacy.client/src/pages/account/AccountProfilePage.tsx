import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useMe, useUpdateProfile, useChangePassword } from "@/hooks/useProfile"
import { toast } from "@/store/toastStore"

const inputClass =
  "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"

const AccountProfilePage = () => {
  const { data: me, isLoading } = useMe()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (me) {
      setFirstName(me.first_name)
      setLastName(me.last_name)
    }
  }, [me])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile.mutateAsync({ first_name: firstName, last_name: lastName })
      toast.success("Profile saved.")
    } catch {
      toast.error("Could not save your profile.")
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.")
      return
    }
    try {
      await changePassword.mutateAsync({ old_password: oldPassword, new_password: newPassword })
      toast.success("Password changed.")
      setOldPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err: any) {
      const data = err?.response?.data
      toast.error(
        data?.old_password?.[0] ?? data?.new_password?.[0] ?? "Could not change the password.",
      )
    }
  }

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-muted" />

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="h-fit rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <p className="mb-4 text-xs text-muted-foreground">How your name appears on orders</p>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-foreground">
            Email
            <input value={me?.email ?? ""} disabled className={`${inputClass} opacity-60`} />
          </label>
          <label className="block text-xs font-medium text-foreground">
            First name
            <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-foreground">
            Last name
            <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
          </label>
        </div>

        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="mt-4 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {updateProfile.isPending && <Loader2 size={13} className="animate-spin" />}
          Save changes
        </button>
      </form>

      {/* Password */}
      <form onSubmit={handleChangePassword} className="h-fit rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Change password</h2>
        <p className="mb-4 text-xs text-muted-foreground">At least 8 characters, not too similar to your name</p>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-foreground">
            Current password
            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className={inputClass} required />
          </label>
          <label className="block text-xs font-medium text-foreground">
            New password
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} required minLength={8} />
          </label>
          <label className="block text-xs font-medium text-foreground">
            Confirm new password
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} required />
          </label>
        </div>

        <button
          type="submit"
          disabled={changePassword.isPending}
          className="mt-4 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {changePassword.isPending && <Loader2 size={13} className="animate-spin" />}
          Change password
        </button>
      </form>
    </div>
  )
}

export default AccountProfilePage
