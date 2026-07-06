import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaymentMethodSelect } from "@/components/payment-method-select"
import { InputWithField } from "@/components/input-with-field"
import { CardWithBody } from "@/components/card-with-body"
import { toast } from "sonner"
import { PageLoader } from "@/components/page-loader"

export default function Report() {
    const { user } = useAuth()
    const [wallet, setWallet] = useState("all")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

    const [loading, setLoading] = useState(false)
    const [reportData, setReportData] = useState<{
        openingBalance: number;
        periodIncome: number;
        periodExpense: number;
        closingBalance: number;
        transactions: any[];
    } | null>(null)

    const handleGenerateReport = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!startDate || !endDate) {
            toast.error("Start Date and End Date are strictly required.")
            return
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error("Start Date cannot be after End Date.")
            return
        }

        setLoading(true)

        try {
            // Because wallets start at 0, Opening Balance is purely the sum of all historical activity 
            // strictly BEFORE the selected start date for this specific wallet.
            let pastQuery = supabase
                .from('transaction')
                .select('transaction_name, amount')
                .eq('user_id', user?.id)
                .lt('transaction_date', startDate)

            if (wallet && wallet !== 'all') {
                pastQuery = pastQuery.eq('payment_method_id', parseInt(wallet))
            }

            const { data: pastData, error: pastError } = await pastQuery

            if (pastError) throw pastError

            let openingBalance = 0
            if (pastData) {
                pastData.forEach(tx => {
                    const amt = Number(tx.amount)
                    if (tx.transaction_name === 'income') openingBalance += amt
                    else if (tx.transaction_name === 'expense') openingBalance -= amt
                })
            }

            // Fetch the period's data
            let periodQuery = supabase
                .from('transaction')
                .select('*')
                .eq('user_id', user?.id)
                .gte('transaction_date', startDate)
                .lte('transaction_date', endDate)
                .order('transaction_date', { ascending: true })

            if (wallet && wallet !== 'all') {
                periodQuery = periodQuery.eq('payment_method_id', parseInt(wallet))
            }

            const { data: periodData, error: periodError } = await periodQuery

            if (periodError) throw periodError

            let periodIncome = 0
            let periodExpense = 0
            const transactions = periodData || []

            transactions.forEach(tx => {
                const amt = Number(tx.amount)
                if (tx.transaction_name === 'income') periodIncome += amt
                else if (tx.transaction_name === 'expense') periodExpense += amt
            })

            const closingBalance = openingBalance + periodIncome - periodExpense

            setReportData({
                openingBalance,
                periodIncome,
                periodExpense,
                closingBalance,
                transactions
            })

            toast.success("Report Generated!")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to generate report")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 space-y-6">
            <Card className="border-border/50 shadow-sm max-w-4xl">
                <CardHeader>
                    <CardTitle>Filtered Financial Report</CardTitle>
                    <CardDescription>Select a specific wallet or leave as "All Wallets" to dissect your liquidity across dates</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <PaymentMethodSelect
                            id="report-wallet"
                            label="Wallet"
                            value={wallet}
                            onChange={setWallet}
                            placeholder="Select Wallet"
                            showAllOption={true}
                        />
                        <InputWithField
                            id="start-date"
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={setStartDate}
                        />
                        <InputWithField
                            id="end-date"
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={setEndDate}
                        />
                        <Button type="submit" disabled={loading} className="w-full mb-[8px]">
                            {loading ? "Calculating..." : "Generate"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {loading ? (
                <PageLoader text="Crunching the numbers..." />
            ) : reportData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <CardWithBody titel="Opening Balance" description="At Start Date" footer={<span className="text-xs text-muted-foreground">{new Date(startDate).toLocaleDateString()}</span>}>
                            <div className="text-2xl font-bold">₹{reportData.openingBalance.toFixed(2)}</div>
                        </CardWithBody>
                        <CardWithBody titel="Period Income" description={`During Filter`} footer={<span className="text-xs text-muted-foreground">+ in reporting period</span>}>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                +₹{reportData.periodIncome.toFixed(2)}
                            </div>
                        </CardWithBody>
                        <CardWithBody titel="Period Expense" description={`During Filter`} footer={<span className="text-xs text-muted-foreground">- in reporting period</span>}>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                -₹{reportData.periodExpense.toFixed(2)}
                            </div>
                        </CardWithBody>
                        <CardWithBody titel="Closing Balance" description="At End Date" footer={<span className="text-xs text-muted-foreground">{new Date(endDate).toLocaleDateString()}</span>}>
                            <div className={`text-2xl font-bold ${reportData.closingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ₹{reportData.closingBalance.toFixed(2)}
                            </div>
                        </CardWithBody>
                    </div>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Period Transactions</CardTitle>
                            <CardDescription>Your activity logged from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reportData.transactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No activity during this period.</p>
                            ) : (
                                <div className="rounded-xl border divide-y overflow-hidden shadow-sm">
                                    {reportData.transactions.map((tx) => (
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
                                                    <span>{tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : new Date(tx.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className={`text-lg self-end sm:self-auto font-bold tabular-nums ${tx.transaction_name === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {tx.transaction_name === 'income' ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
