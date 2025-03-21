export interface User {
    id: string;
    username: string;
    name: string | null;
    email: string;
}
export interface ExpenseEntry {
    person: string;
    item: string;
    amount: number;
}
export interface Participant {
    username: string;
    name?: string;
    amount: number;
    item?: string;
    is_payer?: boolean;
}
export enum SplitMethod {
    EQUAL = "equal",
    UNEQUAL = "unequal",
}
export interface Expense {
    id: string;
    title: string;
    date: string;
    split_method: SplitMethod;
    total_amount: number;
    created_at: string;
    paid_by: string | null;
    participants: Participant[];
}

export interface NewEntry {
    person: string;
    item: string;
    amount: string;
}
export interface CreateExpensePayload {
    title: string;
    total_amount: number;
    date?: string;
    split_method?: SplitMethod;
    item?: string;
}

export interface UpdateExpensePayload {
    title?: string;
    total_amount?: number;
    date?: string;
    split_method?: SplitMethod;
}

export interface AddParticipantPayload {
    username: string;
    amount?: number;
    item?: string;
}

export interface UpdateParticipantPayload {
    amount?: number;
    item?: string;
}

export interface ShareExpenseReceiptProps {
    isShareSheetOpen: boolean;
    setIsShareSheetOpen: (open: boolean) => void;
    currentExpense: Expense | null;
    calculateTotal: (entries: ExpenseEntry[] | undefined) => number;
    getUniquePersons: (entries: ExpenseEntry[] | undefined) => string[];
    calculatePersonTotal: (entries: ExpenseEntry[], person: string) => number;
}
