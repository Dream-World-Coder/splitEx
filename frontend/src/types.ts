export interface ExpenseEntry {
    person: string;
    item: string;
    amount: number;
}

export interface Expense {
    id: number;
    title: string;
    date: string;
    total: number;
    entries: ExpenseEntry[];
}

export interface NewEntry {
    person: string;
    item: string;
    amount: string;
}

export interface ShareExpenseReceiptProps {
    isShareSheetOpen: boolean;
    setIsShareSheetOpen: (open: boolean) => void;
    currentExpense: Expense | null;
    calculateTotal: (entries: ExpenseEntry[] | undefined) => number;
    getUniquePersons: (entries: ExpenseEntry[] | undefined) => string[];
    calculatePersonTotal: (entries: ExpenseEntry[], person: string) => number;
}
