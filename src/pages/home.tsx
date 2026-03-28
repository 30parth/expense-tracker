
import { useState, useEffect } from "react"
import { CardWithBody } from "@/components/card-with-body"
import { Button } from "@/components/ui/button"
import { PaymentMethodSelect } from "@/components/payment-method-select"
import { TransactionTypeSelect } from "@/components/transaction-type-select"
import { InputWithField } from "@/components/input-with-field"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { PageLoader } from "@/components/page-loader"

export default function Home() {
    const { user } = useAuth()
    const [wallet, setWallet] = useState("")
    const [type, setType] = useState("")
    const [amount, setAmount] = useState("")
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)

    const [totalIncome, setTotalIncome] = useState(0)
    const [totalExpense, setTotalExpense] = useState(0)
    const [incomeCount, setIncomeCount] = useState(0)
    const [expenseCount, setExpenseCount] = useState(0)
    const [walletsList, setWalletsList] = useState<any[]>([])

    const [isFetching, setIsFetching] = useState(true)

    const fetchDashboardData = async () => {
        if (!user) return
        
        setIsFetching(true)

        // Fetch specific transactions
        const { data, error } = await supabase
            .from('transaction')
            .select('transaction_name, amount')
            .eq('user_id', user.id)

        if (!error && data) {
            let inc = 0, exp = 0
            let iCount = 0, eCount = 0

            data.forEach((t) => {
                if (t.transaction_name === 'income') {
                    inc += Number(t.amount)
                    iCount++
                } else if (t.transaction_name === 'expense') {
                    exp += Number(t.amount)
                    eCount++
                }
            })

            setTotalIncome(inc)
            setTotalExpense(exp)
            setIncomeCount(iCount)
            setExpenseCount(eCount)
        }

        // Fetch wallet balances
        const { data: wData, error: wError } = await supabase
            .from('payment_type')
            .select('*')
            .eq('user_id', user.id)
            .order('payment_name', { ascending: true })

        if (!wError && wData) {
            setWalletsList(wData)
        }
        setIsFetching(false)
    }

    useEffect(() => {
        fetchDashboardData()
    }, [user])

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

            // Re-fetch totals and wallets!
            fetchDashboardData()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to add transaction")
        } finally {
            setLoading(false)
        }
    }

    const totalBalance = walletsList.reduce((acc, w) => acc + Number(w.current_balance), 0)

    if (isFetching) {
        return <PageLoader text="Loading your financial overview..." className="min-h-[80vh]" />
    }

    return (
        <div className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CardWithBody
                    titel="Total Income"
                    description=""
                    footer={<span className="text-sm text-muted-foreground">From {incomeCount} transactions</span>}
                >
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        ${totalIncome.toFixed(2)}
                    </div>
                </CardWithBody>
                <CardWithBody
                    titel="Total Expenses"
                    description=""
                    footer={<span className="text-sm text-muted-foreground">From {expenseCount} transactions</span>}
                >
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        ${totalExpense.toFixed(2)}
                    </div>
                </CardWithBody>
                <CardWithBody
                    titel="Balance"
                    description=""
                    footer={<span className="text-sm text-muted-foreground">Across all wallets</span>}
                >
                    <div className={`text-3xl font-bold ${totalBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                        ${totalBalance.toFixed(2)}
                    </div>
                </CardWithBody>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {walletsList.map((w) => (
                    <CardWithBody
                        key={w.id}
                        titel={w.payment_name}
                        description="Wallet Balance"
                        footer={<span className="text-xs text-muted-foreground">{w.payment_slug}</span>}
                    >
                        <div className="text-2xl font-semibold">
                            ${Number(w.current_balance).toFixed(2)}
                        </div>
                    </CardWithBody>
                ))}
            </div>

            <Card className="border-border/50 shadow-sm ">
                <CardHeader>
                    <CardTitle>Add New Transaction</CardTitle>
                    <CardDescription>Record your expenses and incomes directly to your wallets</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddTransaction}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PaymentMethodSelect
                                value={wallet}
                                onChange={setWallet}
                                id="wallet-select"
                            />
                            <TransactionTypeSelect
                                value={type}
                                onChange={setType}
                                id="type-select"
                            />
                        </div>

                        <InputWithField
                            id="transaction-amount"
                            label="Amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={setAmount}
                        />

                        <InputWithField
                            id="transaction-date"
                            label="Date"
                            type="date"
                            value={transactionDate}
                            onChange={setTransactionDate}
                        />

                        <InputWithField
                            id="transaction-description"
                            label="Description"
                            type="text"
                            placeholder="What was this for?"
                            value={description}
                            onChange={setDescription}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? "Adding..." : "Add Transaction"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
