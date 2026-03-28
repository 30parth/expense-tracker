import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputWithField } from "@/components/input-with-field"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { PageLoader } from "@/components/page-loader"

export default function Settings() {
    const { user } = useAuth()
    const [paymentName, setPaymentName] = useState("")
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [methods, setMethods] = useState<any[]>([])

    const fetchMethods = async () => {
        if (!user) return
        setIsFetching(true)
        const { data, error } = await supabase
            .from('payment_type')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setMethods(data)
        }
        setIsFetching(false)
    }

    useEffect(() => {
        fetchMethods()
    }, [user])

    const handleCreatePaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!paymentName.trim()) {
            toast.error("Payment name is required")
            return
        }

        setLoading(true)
        const slug = `${paymentName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${user.id}-${Date.now()}`

        const { error } = await supabase
            .from('payment_type')
            .insert([{
                user_id: user.id,
                payment_name: paymentName,
                payment_slug: slug,
                current_balance: 0,
                created_by: user.id
            }])

        setLoading(false)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success("Payment method created successfully!")
            setPaymentName("")
            fetchMethods()
        }
    }

    if (isFetching) {
        return <PageLoader text="Loading your registered wallets..." className="min-h-[60vh]"/>
    }

    return (
        <div className="p-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Create Payment Method</CardTitle>
                    <CardDescription>Add a new way to track your funds (e.g., Bank, Wallet)</CardDescription>
                </CardHeader>
                <form onSubmit={handleCreatePaymentMethod}>
                    <CardContent className="space-y-4">
                        <InputWithField
                            id="payment-name"
                            label="Method Name"
                            type="text"
                            value={paymentName}
                            onChange={setPaymentName}
                            placeholder="e.g. Chase"
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? "Creating..." : "Save Payment Method"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="col-span-1 md:col-span-2 lg:col-span-2 border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Your Payment Methods</CardTitle>
                    <CardDescription>Manage your registered accounts and wallets</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {methods.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No payment methods found.</p>
                        ) : (
                            methods.map((method) => (
                                <div key={method.id} className="flex justify-between items-center p-3 rounded-xl border bg-card/50 hover:bg-accent/30 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-sm">{method.payment_name}</span>
                                        <span className="text-xs text-muted-foreground">ID: {method.payment_slug}</span>
                                    </div>
                                    <div className="font-bold text-success dark:text-green-400">
                                        ${Number(method.current_balance).toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
