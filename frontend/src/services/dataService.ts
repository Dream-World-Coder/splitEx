import authAxios from "./authAxios";

// type
export interface User {
    id: string;
    username: string;
    name: string | null;
    email: string;
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

// Expense related functions
const expenseService = {
    // get all expenses for current user
    getAllExpenses: async (): Promise<Expense[]> => {
        const response = await authAxios.get("/expenses/");
        return response.data;
    },

    // get a specific expense by ID
    getExpenseById: async (expenseId: string): Promise<Expense> => {
        const response = await authAxios.get(`/expenses/${expenseId}`);
        return response.data;
    },

    // create a new expense
    createExpense: async (
        expenseData: CreateExpensePayload,
    ): Promise<string> => {
        const response = await authAxios.post("/expenses/", expenseData);
        return response.data.expense_id;
    },

    // update an existing expense
    updateExpense: async (
        expenseId: string,
        expenseData: UpdateExpensePayload,
    ): Promise<void> => {
        await authAxios.put(`/expenses/${expenseId}`, expenseData);
    },

    // delete an expense
    deleteExpense: async (expenseId: string): Promise<void> => {
        await authAxios.delete(`/expenses/${expenseId}`);
    },
};

// participant related
const participantService = {
    // get all participants for an expense
    getExpenseParticipants: async (
        expenseId: string,
    ): Promise<Participant[]> => {
        const response = await authAxios.get(
            `/participants/${expenseId}/participants`,
        );
        return response.data;
    },

    // add a participant to an expense
    addParticipant: async (
        expenseId: string,
        participantData: AddParticipantPayload,
    ): Promise<string> => {
        const response = await authAxios.post(
            `/participants/${expenseId}/add`,
            participantData,
        );
        return response.data.participant_id;
    },

    // update a participant's details
    updateParticipant: async (
        expenseId: string,
        username: string,
        participantData: UpdateParticipantPayload,
    ): Promise<void> => {
        await authAxios.put(
            `/participants/${expenseId}/update/${username}`,
            participantData,
        );
    },

    // remove a participant from an expense
    removeParticipant: async (
        expenseId: string,
        username: string,
    ): Promise<void> => {
        await authAxios.delete(`/participants/${expenseId}/remove/${username}`);
    },
};

// combine all services
const dataService = {
    expenses: expenseService,
    participants: participantService,
};

export default dataService;
