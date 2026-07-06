import { useState } from "react"
import { Plus } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { PaymentMethodSelect } from "./payment-method-select"
import { TransactionTypeSelect } from "./transaction-type-select"
import { InputWithField } from "./input-with-field"

export function FloatingActionButton() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [wallet, setWallet] = useState("")
    const [type, setType] = useState("")
    const [amount, setAmount] = useState("")
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)

    if (!user) return null

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!wallet || !type || !amount) {
            toast.error("Please fill in the wallet, type, and amount.")
            return
        }

        setLoading(true)

        try {
            const numericAmount = parseFloat(amount)

            const { error: insertError } = await supabase
                .from('transaction')
                .insert([{
                    user_id: user.id,
                    payment_method_id: parseInt(wallet),
                    transaction_name: type,
                    amount: numericAmount,
                    transaction_date: transactionDate,
                    description: description,
                    created_by: user.id
                }])

            if (insertError) throw insertError

            // Automatically Update Wallet Balance
            const { data: walletData, error: fetchError } = await supabase
                .from('payment_type')
                .select('current_balance')
                .eq('id', parseInt(wallet))
                .single()

            if (!fetchError && walletData) {
                const updatedBalance = type === 'income'
                    ? Number(walletData.current_balance) + numericAmount
                    : Number(walletData.current_balance) - numericAmount

                await supabase
                    .from('payment_type')
                    .update({ 
                        current_balance: updatedBalance,
                        updated_at: new Date().toISOString(),
                        updated_by: user.id
                    })
                    .eq('id', parseInt(wallet))
            }

            toast.success("Transaction added successfully!")

            // Reset form
            setAmount("")
            setDescription("")
            setTransactionDate(new Date().toISOString().split('T')[0])
            setWallet("")
            setType("")

            // Dispatch global event for synchronization across pages
            window.dispatchEvent(new Event("transaction-added"))

            // Close modal
            setIsOpen(false)

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to add transaction")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-200 z-50 border border-primary/20"
                    aria-label="Add transaction"
                >
                    <Plus className="h-6 w-6 transition-transform duration-200 group-hover:rotate-90" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                    <DialogDescription>
                        Record your expenses and incomes directly to your wallets from any screen.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTransaction} className="space-y-4 py-2">
                    <PaymentMethodSelect
                        value={wallet}
                        onChange={setWallet}
                        id="fab-wallet-select"
                    />
                    <TransactionTypeSelect
                        value={type}
                        onChange={setType}
                        id="fab-type-select"
                    />
                    <InputWithField
                        id="fab-transaction-amount"
                        label="Amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={setAmount}
                    />
                    <InputWithField
                        id="fab-transaction-date"
                        label="Date"
                        type="date"
                        value={transactionDate}
                        onChange={setTransactionDate}
                    />
                    <InputWithField
                        id="fab-transaction-description"
                        label="Description"
                        type="text"
                        placeholder="What was this for?"
                        value={description}
                        onChange={setDescription}
                    />
                    <div className="flex justify-end pt-4 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Transaction"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
