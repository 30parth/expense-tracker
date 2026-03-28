import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputWithField } from "@/components/input-with-field"
import { useAuth, hashPassword } from "@/context/auth-context"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function Profile() {
    const { user } = useAuth()
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)

    if (!user) {
        return null
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("All password fields are required.")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.")
            return
        }

        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters.")
            return
        }

        setLoading(true)

        try {
            const hashedCurrentPassword = await hashPassword(currentPassword)

            // Verify the current password matches the one stored in Supabase
            // We fetch specific row to absolutely ensure we're securely checking against db truth
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('id, password')
                .eq('id', user.id)
                .single()

            if (fetchError || !userData) {
                toast.error("Failed to verify user profile.")
                setLoading(false)
                return
            }

            if (userData.password !== hashedCurrentPassword) {
                toast.error("Current password is incorrect.")
                setLoading(false)
                return
            }

            // Hash new password and update
            const hashedNewPassword = await hashPassword(newPassword)
            const { error: updateError } = await supabase
                .from('users')
                .update({ password: hashedNewPassword, updated_at: new Date().toISOString() })
                .eq('id', user.id)

            if (updateError) {
                toast.error("Failed to update password: " + updateError.message)
            } else {
                toast.success("Password changed successfully!")
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            }
        } catch (error: any) {
            toast.error("An unexpected error occurred.")
            console.error(error)
        }

        setLoading(false)
    }

    return (
        <div className="p-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your personal account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="font-semibold text-lg">{user.name}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="font-semibold text-lg">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Account ID</label>
                        <p className="font-mono text-xs text-muted-foreground">{user.id}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 lg:col-span-2 border-border/50 shadow-sm flex flex-col justify-between">
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Update your existing password to keep your account safe</CardDescription>
                </CardHeader>
                <form onSubmit={handleChangePassword}>
                    <CardContent className="space-y-4">
                        <InputWithField
                            id="current-password"
                            label="Current Password"
                            type="password"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            placeholder="Enter your current password"
                        />
                        <div className="h-px w-full bg-border my-2" />
                        <InputWithField
                            id="new-password"
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={setNewPassword}
                            placeholder="Enter a new password"
                        />
                        <InputWithField
                            id="confirm-password"
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Type your new password again"
                        />
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto mt-4">
                            {loading ? "Updating..." : "Change Password"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
