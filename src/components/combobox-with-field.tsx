import { Field, FieldDescription, FieldError, FieldLabel } from "./ui/field"
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxEmpty
} from "./ui/combobox"

export interface ComboboxItemType {
    label: string;
    value: string;
}

interface ComboboxWithFieldProps {
    id: string;
    label: string;
    items: ComboboxItemType[];
    onChange: (value: string | null) => void;
    value?: string | null;
    placeholder?: string;
    errorMessage?: string;
    description?: string;
}

export const ComboboxWithField = ({
    id,
    label,
    items,
    onChange,
    value,
    placeholder,
    errorMessage,
    description,
}: ComboboxWithFieldProps) => {
    return (
        <Field className="mb-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Combobox value={value} onValueChange={(val) => onChange(val as string | null)}>
                <ComboboxInput
                    id={id}
                    placeholder={placeholder}
                    {...(errorMessage ? { 'aria-invalid': true } : {})}
                />
                <ComboboxContent>
                    <ComboboxList>
                        {items.length === 0 && <ComboboxEmpty>No items found.</ComboboxEmpty>}
                        {items.map((item) => (
                            <ComboboxItem key={item.value} value={item.value}>
                                {item.label}
                            </ComboboxItem>
                        ))}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
            {description && <FieldDescription>{description}</FieldDescription>}
            {errorMessage && <FieldError>{errorMessage}</FieldError>}
        </Field>
    )
}
