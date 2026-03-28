import { InputWithField } from "@/components/input-with-field";
import { ComboboxWithField } from "@/components/combobox-with-field";
import { SelectWithField } from "@/components/select-with-field";
import { PaymentMethodSelect } from "@/components/payment-method-select";
import { TransactionTypeSelect } from "@/components/transaction-type-select";

const items = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Orange", value: "orange" },
];

export const Fields = () => {
    return (
        <div className="p-4 grid gap-4">
            <InputWithField
                id="name"
                label="Full name"
                value={'Parth Solanki'}
                type="text"
                onChange={(value) => console.log(value)}
                description="This appears on invoices and emails"
            />

            <ComboboxWithField
                id="fruit-selector"
                label="Select fruit (Combobox)"
                placeholder="Search for a fruit..."
                items={items}
                onChange={(val) => console.log("Combobox Selected value:", val)}
                errorMessage="Something went wrong!"
            />

            <PaymentMethodSelect
                id="my-wallet"
                label="Choose Wallet"
                onChange={(val: string) => console.log("Selected Wallet ID:", val)}
                description="Automatically loaded from Supabase for the current user!"
            />

            <TransactionTypeSelect
                id="my-transaction-type"
                label="Type"
                onChange={(val: string) => console.log("Selected Transaction Type:", val)}
                description="Filter by money coming in or going out"
            />

            <SelectWithField
                id="fruit-select"
                label="Select fruit (Select)"
                placeholder="Pick a fruit..."
                items={items}
                onChange={(val) => console.log("Select Selected value:", val)}
                description="Standard select dropdown"
            />

            {/* <CardWithBody
                titel="Card Title"
                description="Card Description"
                footer={<Button>Card Footer</Button>}
            >
                <p>Card Content</p>
            </CardWithBody> */}
        </div>
    );
};