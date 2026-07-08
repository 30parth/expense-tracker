
import { useState, useEffect, useCallback } from "react"
import { CardWithBody } from "@/components/card-with-body"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { PageLoader } from "@/components/page-loader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Label,
    Line,
    LineChart,
    Pie,
    PieChart,
    XAxis,
    YAxis
} from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig
} from "@/components/ui/chart"
import { ArrowDownRight, ArrowUpRight, Coins } from "lucide-react"

const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
        notation: 'compact',
        compactDisplay: 'short'
    }).format(value)
}

interface Wallet {
    id: number
    payment_name: string
    payment_slug: string
    current_balance: string | number
}

interface ChartDataPoint {
    date: string
    rawDate: string
    income: number
    expense: number
    totalBalance: number
    [key: string]: number | string
}

const WALLET_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f97316", // Orange
]

export default function Home() {
    const { user } = useAuth()

    const [totalIncome, setTotalIncome] = useState(0)
    const [totalExpense, setTotalExpense] = useState(0)
    const [incomeCount, setIncomeCount] = useState(0)
    const [expenseCount, setExpenseCount] = useState(0)
    const [walletsList, setWalletsList] = useState<Wallet[]>([])
    const [chartDataList, setChartDataList] = useState<ChartDataPoint[]>([])
    const [todayIncome, setTodayIncome] = useState(0)
    const [todayExpense, setTodayExpense] = useState(0)
    const [timeframe, setTimeframe] = useState<'7d' | '30d'>('30d')

    const [isFetching, setIsFetching] = useState(true)

    const fetchDashboardData = useCallback(async () => {
        if (!user) return
        
        setIsFetching(true)

        // 1. Fetch ALL transactions for the user
        const { data: txData, error: txError } = await supabase
            .from('transaction')
            .select('id, transaction_name, amount, transaction_date, payment_method_id')
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: true })

        // 2. Fetch all payment methods (wallets)
        const { data: wData, error: wError } = await supabase
            .from('payment_type')
            .select('*')
            .eq('user_id', user.id)
            .order('payment_name', { ascending: true })

        if (txError || wError) {
            setIsFetching(false)
            return
        }

        const wallets = wData || []
        const transactions = txData || []

        setWalletsList(wallets)

        // Calculate total income, expense, and transaction counts
        let inc = 0, exp = 0
        let iCount = 0, eCount = 0
        transactions.forEach((t) => {
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

        // Generate dates for the last 30 days
        const dates: string[] = []
        for (let i = 29; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            dates.push(d.toISOString().split('T')[0])
        }

        const startDate = dates[0]

        // Calculate starting balances for each wallet prior to the 30-day window
        const walletBalances: Record<number, number> = {}
        wallets.forEach((w) => {
            walletBalances[w.id] = 0
        })

        const priorTransactions = transactions.filter(t => t.transaction_date < startDate)
        priorTransactions.forEach((t) => {
            const wId = Number(t.payment_method_id)
            const amt = Number(t.amount)
            if (walletBalances[wId] === undefined) {
                walletBalances[wId] = 0
            }
            if (t.transaction_name === 'income') {
                walletBalances[wId] += amt
            } else if (t.transaction_name === 'expense') {
                walletBalances[wId] -= amt
            }
        })

        // Now compute daily data points inside the 30-day window
        const windowTransactions = transactions.filter(t => t.transaction_date >= startDate)
        
        // Group transactions by date for quick lookup
        const txByDate: Record<string, typeof transactions> = {}
        windowTransactions.forEach((t) => {
            if (!txByDate[t.transaction_date]) {
                txByDate[t.transaction_date] = []
            }
            txByDate[t.transaction_date].push(t)
        })

        const computedChartData: ChartDataPoint[] = []

        dates.forEach((dStr) => {
            const txsOnDate = txByDate[dStr] || []
            let dailyIncome = 0
            let dailyExpense = 0

            txsOnDate.forEach((t) => {
                const wId = Number(t.payment_method_id)
                const amt = Number(t.amount)
                if (walletBalances[wId] === undefined) {
                    walletBalances[wId] = 0
                }
                if (t.transaction_name === 'income') {
                    dailyIncome += amt
                    walletBalances[wId] += amt
                } else if (t.transaction_name === 'expense') {
                    dailyExpense += amt
                    walletBalances[wId] -= amt
                }
            })

            const totalBalance = Object.values(walletBalances).reduce((sum, val) => sum + val, 0)

            // Format date string for displaying in XAxis (e.g., "Jul 07")
            const dateObj = new Date(dStr + 'T00:00:00') // avoid timezone shifts
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            const dataPoint: ChartDataPoint = {
                date: formattedDate,
                rawDate: dStr,
                income: dailyIncome,
                expense: dailyExpense,
                totalBalance: totalBalance,
            }

            // Add breakdown of each wallet balance
            wallets.forEach((w) => {
                dataPoint[`wallet_${w.id}`] = walletBalances[w.id] || 0
            })

            computedChartData.push(dataPoint)
        })

        setChartDataList(computedChartData)

        // Today's contribution
        const todayStr = new Date().toISOString().split('T')[0]
        const todayTxs = txByDate[todayStr] || transactions.filter(t => t.transaction_date === todayStr)
        let todayInc = 0
        let todayExp = 0
        todayTxs.forEach((t) => {
            if (t.transaction_name === 'income') todayInc += Number(t.amount)
            else if (t.transaction_name === 'expense') todayExp += Number(t.amount)
        })
        setTodayIncome(todayInc)
        setTodayExpense(todayExp)

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
    const totalPositiveBalance = walletsList.reduce((sum, w) => sum + Math.max(0, Number(w.current_balance)), 0)

    const pieData = walletsList.map((w, idx) => ({
        name: w.payment_name,
        value: Math.max(0, Number(w.current_balance)),
        color: WALLET_COLORS[idx % WALLET_COLORS.length],
        id: w.id
    }))

    const filteredChartData = timeframe === '7d' ? chartDataList.slice(-7) : chartDataList

    // Dynamic Chart Config matching Shadcn architecture
    const chartConfig = {
        income: {
            label: "Income",
            color: "#10b981",
        },
        expense: {
            label: "Expense",
            color: "#ef4444",
        },
        totalBalance: {
            label: "Total Balance",
            color: "#3b82f6",
        },
        ...Object.fromEntries(
            walletsList.map((w, idx) => [
                `wallet_${w.id}`,
                {
                    label: w.payment_name,
                    color: WALLET_COLORS[idx % WALLET_COLORS.length],
                }
            ])
        )
    } as ChartConfig

    if (isFetching) {
        return <PageLoader text="Loading your financial overview..." className="min-h-[80vh]" />
    }

    return (
        <div className="p-4 space-y-6">
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CardWithBody
                    titel="Total Income"
                    description=""
                    footer={<span className="text-sm text-muted-foreground">From {incomeCount} transactions</span>}
                >
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-sans tracking-tight">
                        ₹{totalIncome.toFixed(2)}
                    </div>
                </CardWithBody>
                <CardWithBody
                    titel="Total Expenses"
                    description=""
                    footer={<span className="text-sm text-muted-foreground">From {expenseCount} transactions</span>}
                >
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400 font-sans tracking-tight">
                        ₹{totalExpense.toFixed(2)}
                    </div>
                </CardWithBody>
                <CardWithBody
                    titel="Balance"
                    description=""
                    footer={<span className="text-sm text-muted-foreground">Across all wallets</span>}
                >
                    <div className={`text-3xl font-bold font-sans tracking-tight ${totalBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                        ₹{totalBalance.toFixed(2)}
                    </div>
                </CardWithBody>
            </div>

            {/* Premium Analytics and Charts Section */}
            <Card className="border border-border/50 shadow-sm">
                <CardHeader className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4 border-b border-border/40">
                        <div>
                            <CardTitle className="text-xl font-semibold">Financial Analytics</CardTitle>
                            <CardDescription>Visualizing your cash flow and wallet trends</CardDescription>
                        </div>
                        
                        {/* Today's Transactions Summary Badge */}
                        <div className="flex flex-wrap items-center gap-3 bg-muted/40 dark:bg-muted/15 p-2 rounded-lg border border-border/30">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Today's Activity:</span>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 font-semibold text-xs">
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                <span>+₹{todayIncome.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-xs">
                                <ArrowDownRight className="h-3.5 w-3.5" />
                                <span>-₹{todayExpense.toFixed(2)}</span>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs ${
                                todayIncome - todayExpense >= 0 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                                <Coins className="h-3.5 w-3.5" />
                                <span>Net: {todayIncome - todayExpense >= 0 ? '+' : ''}₹{(todayIncome - todayExpense).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    <Tabs defaultValue="cashflow" className="w-full space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <TabsList className="bg-muted/65 p-1 rounded-lg self-start">
                                <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                                <TabsTrigger value="wallets">Wallets Breakdown</TabsTrigger>
                                <TabsTrigger value="balance">Total Balance</TabsTrigger>
                            </TabsList>
                            
                            {/* Timeframe Filter Buttons */}
                            <div className="flex items-center bg-muted/65 p-0.5 rounded-lg border border-border/50 self-start sm:self-auto text-xs">
                                <button
                                    type="button"
                                    onClick={() => setTimeframe('7d')}
                                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                                        timeframe === '7d'
                                            ? 'bg-background shadow-xs text-foreground font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    7 Days
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTimeframe('30d')}
                                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                                        timeframe === '30d'
                                            ? 'bg-background shadow-xs text-foreground font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    30 Days
                                </button>
                            </div>
                        </div>

                        {/* Cash Flow Tab Content */}
                        <TabsContent value="cashflow" className="outline-none">
                            <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] w-full aspect-auto">
                                <BarChart accessibilityLayer data={filteredChartData} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        minTickGap={15}
                                        className="text-[11px] fill-muted-foreground"
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={formatCompactCurrency}
                                        className="text-[11px] fill-muted-foreground font-mono"
                                        width={45}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar
                                        name="Income"
                                        dataKey="income"
                                        fill="var(--color-income)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={30}
                                    />
                                    <Bar
                                        name="Expense"
                                        dataKey="expense"
                                        fill="var(--color-expense)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={30}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </TabsContent>

                        {/* Wallets Breakdown Tab Content */}
                        <TabsContent value="wallets" className="outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                {/* Donut Allocation Share */}
                                <Card className="lg:col-span-2 border border-border/40 bg-muted/10 shadow-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Asset Allocation</CardTitle>
                                        <CardDescription>Current balance share per wallet</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center pb-4">
                                        {totalPositiveBalance > 0 ? (
                                            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[200px] w-full">
                                                <PieChart>
                                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                    <Pie
                                                        data={pieData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        strokeWidth={5}
                                                        paddingAngle={2}
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                        <Label
                                                            content={({ viewBox }) => {
                                                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                                    return (
                                                                        <text
                                                                            x={viewBox.cx}
                                                                            y={viewBox.cy}
                                                                            textAnchor="middle"
                                                                            dominantBaseline="middle"
                                                                        >
                                                                            <tspan
                                                                                x={viewBox.cx}
                                                                                y={viewBox.cy}
                                                                                className="fill-foreground text-lg font-bold"
                                                                            >
                                                                                ₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                                            </tspan>
                                                                            <tspan
                                                                                x={viewBox.cx}
                                                                                y={(viewBox.cy || 0) + 18}
                                                                                className="fill-muted-foreground text-[10px] font-medium"
                                                                            >
                                                                                Total Balance
                                                                            </tspan>
                                                                        </text>
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                    </Pie>
                                                </PieChart>
                                            </ChartContainer>
                                        ) : (
                                            <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                                                No positive wallet balance to display.
                                            </div>
                                        )}
                                        {/* Color labels & percentage breakdown */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-[11px] mt-2">
                                            {walletsList.map((w, idx) => {
                                                const color = WALLET_COLORS[idx % WALLET_COLORS.length]
                                                const pct = totalPositiveBalance > 0
                                                    ? (Math.max(0, Number(w.current_balance)) / totalPositiveBalance * 100).toFixed(0)
                                                    : '0'
                                                return (
                                                    <div key={w.id} className="flex items-center justify-between border-b border-border/20 py-1">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <div className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: color }} />
                                                            <span className="truncate text-muted-foreground">{w.payment_name}</span>
                                                        </div>
                                                        <span className="font-semibold font-mono">{pct}%</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Historical Line Trend Chart */}
                                <Card className="lg:col-span-3 border border-border/40 bg-muted/10 shadow-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Wallet Balance Trend</CardTitle>
                                        <CardDescription>Historical trend over {timeframe === '7d' ? '7' : '30'} days</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full aspect-auto">
                                            <LineChart accessibilityLayer data={filteredChartData} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                                                <XAxis
                                                    dataKey="date"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={8}
                                                    minTickGap={15}
                                                    className="text-[11px] fill-muted-foreground"
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={8}
                                                    tickFormatter={formatCompactCurrency}
                                                    className="text-[11px] fill-muted-foreground font-mono"
                                                    width={45}
                                                />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <ChartLegend content={<ChartLegendContent />} />
                                                {walletsList.map((w, idx) => {
                                                    const color = WALLET_COLORS[idx % WALLET_COLORS.length]
                                                    return (
                                                        <Line
                                                            key={w.id}
                                                            name={w.payment_name}
                                                            dataKey={`wallet_${w.id}`}
                                                            type="monotone"
                                                            stroke={color}
                                                            strokeWidth={2}
                                                            dot={false}
                                                            activeDot={{ r: 4 }}
                                                        />
                                                    )
                                                })}
                                            </LineChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Balance Trend Tab Content */}
                        <TabsContent value="balance" className="outline-none">
                            <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] w-full aspect-auto">
                                <AreaChart accessibilityLayer data={filteredChartData} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        minTickGap={15}
                                        className="text-[11px] fill-muted-foreground"
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={formatCompactCurrency}
                                        className="text-[11px] fill-muted-foreground font-mono"
                                        width={45}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Area
                                        name="Total Balance"
                                        dataKey="totalBalance"
                                        type="monotone"
                                        fill="url(#fillBalance)"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Wallets Grid */}
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
