import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { PageLoader } from "@/components/page-loader"

export default function Transactions() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions

        const query = searchQuery.toLowerCase().trim()
        return transactions.filter(tx => {
            const description = (tx.description || "").toLowerCase()
            const type = (tx.transaction_name || "").toLowerCase()
            const walletName = (tx.payment_type?.payment_name || "").toLowerCase()
            const amount = Number(tx.amount).toString()

            return description.includes(query) || 
                   type.includes(query) || 
                   walletName.includes(query) || 
                   amount.includes(query)
        })
    }, [transactions, searchQuery])

    const fetchTransactions = async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await supabase
            .from('transaction')
            .select(`
                *,
                payment_type:payment_method_id (payment_name)
            `)
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) {
            toast.error("Failed to fetch transactions")
        } else if (data) {
            setTransactions(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchTransactions()
    }, [user])

    const handleDelete = async (tx: any) => {
        if (!confirm("Are you sure you want to delete this transaction? This will reverse the effect on your wallet balance.")) {
            return
        }

        try {
            // Fetch current wallet balance securely
            const { data: walletData, error: walletError } = await supabase
                .from('payment_type')
                .select('current_balance')
                .eq('id', tx.payment_method_id)
                .single()

            if (walletError || !walletData) {
                toast.error("Failed to fetch related wallet data to reverse balance.")
                return
            }

            const numericAmount = Number(tx.amount)
            const currentBalance = Number(walletData.current_balance)

            // Reverse the math!
            // If it was income, it previously added money. Deleting it REMOVES money.
            // If it was expense, it previously removed money. Deleting it ADDS money.
            let updatedBalance = currentBalance
            if (tx.transaction_name === 'income') {
                updatedBalance -= numericAmount
            } else if (tx.transaction_name === 'expense') {
                updatedBalance += numericAmount
            }

            // Update wallet balance to reflect the deletion
            const { error: updateError } = await supabase
                .from('payment_type')
                .update({
                    current_balance: updatedBalance,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id
                })
                .eq('id', tx.payment_method_id)

            if (updateError) {
                toast.error("Failed to restore wallet balance.")
                return
            }

            // Finally, completely delete transaction row
            const { error: deleteError } = await supabase
                .from('transaction')
                .delete()
                .eq('id', tx.id)

            if (deleteError) {
                toast.error("Failed to delete the transaction record.")
                // Usually we'd rollback the wallet update here for safety.
                return
            }

            toast.success("Transaction successfully deleted and wallet adjusted!")
            fetchTransactions()
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred.")
        }
    }

    return (
        <div className="p-4 space-y-6">
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>View and manage all your past incomes and expenses</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search transactions..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <PageLoader text="Fetching your transaction history..." />
                    ) : transactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No transactions found! Start tracking on your dashboard.</p>
                    ) : filteredTransactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No transactions match your search "{searchQuery}".</p>
                    ) : (
                        <div className="rounded-xl border divide-y overflow-hidden shadow-sm">
                            {filteredTransactions.map((tx) => (
                                <div key={tx.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 hover:bg-muted/50 transition-colors gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="font-semibold text-base leading-none">
                                            {tx.description || "No description provided"}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <span className={`px-2 py-0.5 rounded-full ${tx.transaction_name === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'} capitalize`}>
                                                {tx.transaction_name}
                                            </span>
                                            <span>&bull;</span>
                                            <span>{tx.payment_type?.payment_name || "Unknown Wallet"}</span>
                                            <span>&bull;</span>
                                            <span>{tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : new Date(tx.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end sm:self-auto">
                                        <div className={`text-lg font-bold tabular-nums ${tx.transaction_name === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {tx.transaction_name === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tx)} className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
