import { CardWithBody } from "@/components/card-with-body";
import { InputWithField } from "@/components/input-with-field";
import { Button } from "@/components/ui/button";
import { ComboboxWithField } from "@/components/combobox-with-field";
import { SelectWithField } from "@/components/select-with-field";

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