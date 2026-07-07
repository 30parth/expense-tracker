import { useState, useEffect, useCallback } from "react"
import { CardWithBody } from "@/components/card-with-body"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { PageLoader } from "@/components/page-loader"

interface Wallet {
    id: string | number
    payment_name: string
    payment_slug: string
    current_balance: string | number
}

export default function Balance() {
    const { user } = useAuth()

    const [totalIncome, setTotalIncome] = useState(0)
    const [totalExpense, setTotalExpense] = useState(0)
    const [incomeCount, setIncomeCount] = useState(0)
    const [expenseCount, setExpenseCount] = useState(0)
    const [walletsList, setWalletsList] = useState<Wallet[]>([])

    const [isFetching, setIsFetching] = useState(true)

    const fetchDashboardData = useCallback(async () => {
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
    }, [user])

    useEffect(() => {
        fetchDashboardData()

        const handleRefresh = () => {
            fetchDashboardData()
        }

        window.addEventListener('transaction-added', handleRefresh)
        return () => {
            window.removeEventListener('transaction-added', handleRefresh)
        }
    }, [fetchDashboardData])

    const totalBalance = walletsList.reduce((acc, w) => acc + Number(w.current_balance), 0)

    if (isFetching) {
        return <PageLoader text="Loading your balance overview..." className="min-h-[80vh]" />
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
                        ₹{totalIncome.toFixed(2)}
                    </div>
                </CardWithBody>
                <CardWithBody
                    titel="Total Expenses"
                    description=""
                    footer={<span className="text-sm text-muted-foreground">From {expenseCount} transactions</span>}
                >
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        ₹{totalExpense.toFixed(2)}
                    </div>
                </CardWithBody>
                <CardWithBody
                    titel="Balance"
                    description=""
                    footer={<span className="text-sm text-muted-foreground">Across all wallets</span>}
                >
                    <div className={`text-3xl font-bold ${totalBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                        ₹{totalBalance.toFixed(2)}
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
                            ₹{Number(w.current_balance).toFixed(2)}
                        </div>
                    </CardWithBody>
                ))}
            </div>
        </div>
    )
}
