
import { CardWithBody } from "@/components/card-with-body"

export default function Home() {
    return (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardWithBody
                titel="Total Income"
                description=""
                footer={<span className="text-sm text-muted-foreground">From 0 transactions</span>}
            >
                <div className="text-3xl font-bold">$0.00</div>
            </CardWithBody>
            <CardWithBody
                titel="Total Expenses"
                description=""
                footer={<span className="text-sm text-muted-foreground">From 0 transactions</span>}
            >
                <div className="text-3xl font-bold">$0.00</div>
            </CardWithBody>
            <CardWithBody
                titel="Balance"
                description=""
                footer={<span className="text-sm text-muted-foreground">You are in surplus</span>}
            >
                <div className="text-3xl font-bold">$0.00</div>
            </CardWithBody>
        </div>
    )
}
