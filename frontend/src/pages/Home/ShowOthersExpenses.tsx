import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Share, ChevronLeftCircle } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Expense, Participant } from "@/services/dataService";
import ShareExpenseReceipt from "@/components/ShareExpenseReceipt";

const ExpenseViewOthers: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { username } = useParams();

    const [isShareSheetOpen, setIsShareSheetOpen] = useState<boolean>(false);
    const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);

    const expenses: Expense[] = location.state;
    if (!expenses) {
        return <div>No expense data available.</div>;
    }

    //calculate total amount for an expense
    const calculateTotal = (
        participants: Participant[] | undefined,
    ): number => {
        return (
            participants?.reduce(
                (sum, participant) => sum + participant.amount,
                0,
            ) || 0
        );
    };

    //calculate total amount per person
    const calculatePersonTotal = (
        participants: Participant[],
        username: string,
    ): number => {
        return participants
            .filter((participant) => participant.username === username)
            .reduce((sum, participant) => sum + participant.amount, 0);
    };

    //get unique persons from participants
    const getUniquePersons = (
        participants: Participant[] | undefined,
    ): string[] => {
        return [
            ...new Set(
                (participants ?? []).map((participant) => participant.username),
            ),
        ];
    };

    //handle sharing an expense
    const handleShareReceipt = (expense: Expense) => {
        setCurrentExpense(expense);
        setIsShareSheetOpen(true);
    };

    //handle navigating to expense detail page
    const handleViewExpenseDetail = (expenseId: string) => {
        navigate(`/expense/${expenseId}`);
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 max-w-md mx-auto">
            <h1 className="flex items-center justify-start gap-2 my-4">
                {" "}
                <ChevronLeftCircle onClick={() => navigate(-1)} /> All Expenses
                of {username?.split("+")[0]} with you
            </h1>
            {expenses.length === 0 ? (
                <div className="text-center p-6 space-y-4">
                    <p className="mb-4">
                        No expenses yet.
                        {/* will not occur though */}
                    </p>
                </div>
            ) : (
                expenses.map((expense) => (
                    <Card
                        key={expense.id}
                        className="w-full shadow-sm cursor-pointer my-4"
                        onClick={() => handleViewExpenseDetail(expense.id)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{expense.title}</CardTitle>
                                    <CardDescription>
                                        {new Date(
                                            expense.date,
                                        ).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShareReceipt(expense);
                                        }}
                                    >
                                        <Share size={18} />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">Total:</span>
                                <span className="font-bold">
                                    ₹{expense.total_amount.toFixed(2)}
                                </span>
                            </div>
                            {expense.paid_by && (
                                <div className="text-sm mb-2 text-gray-600">
                                    Paid by: {expense.paid_by}
                                </div>
                            )}
                            <div className="space-y-1">
                                {getUniquePersons(expense.participants).map(
                                    (username) => (
                                        <div
                                            key={username}
                                            className="flex justify-between text-sm"
                                        >
                                            <span>{username}</span>
                                            <span>
                                                ₹
                                                {calculatePersonTotal(
                                                    expense.participants,
                                                    username,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}

            {/* share receipt -> using `sheet` */}
            <ShareExpenseReceipt
                isShareSheetOpen={isShareSheetOpen}
                setIsShareSheetOpen={setIsShareSheetOpen}
                currentExpense={currentExpense}
                calculateTotal={calculateTotal}
                getUniquePersons={getUniquePersons}
                calculatePersonTotal={calculatePersonTotal}
            />
        </div>
    );
};

export default ExpenseViewOthers;
