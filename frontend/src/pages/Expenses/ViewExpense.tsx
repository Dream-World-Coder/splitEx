import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Share, ArrowLeft, Pencil, Trash } from "lucide-react";
import dataService, {
    Expense,
    Participant,
    SplitMethod,
} from "@/services/dataService";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const ViewExpense = () => {
    const { expenseId } = useParams<{ expenseId: string }>();
    const navigate = useNavigate();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchExpense = async () => {
            try {
                if (!expenseId) return;
                setLoading(true);
                const data =
                    await dataService.expenses.getExpenseById(expenseId);
                setExpense(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch expense:", err);
                setError("Failed to load expense details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchExpense();
    }, [expenseId]);

    const handleShareReceipt = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!expense) return;

        // Implementation for sharing the receipt
        if (navigator.share) {
            navigator
                .share({
                    title: `Expense: ${expense.title}`,
                    text: `Check out this expense: ${expense.title} - ₹${expense.total_amount.toFixed(2)}`,
                    url: window.location.href,
                })
                .catch((err) => console.error("Error sharing:", err));
        } else {
            // Fallback for browsers that don't support the Share API
            navigator.clipboard
                .writeText(window.location.href)
                .then(() => alert("Link copied to clipboard!"))
                .catch((err) => console.error("Error copying link:", err));
        }
    };

    const handleEditExpense = () => {
        if (expense) {
            navigate(`/expense/edit/${expense.id}`);
        }
    };

    const handleDeleteExpense = async () => {
        if (
            !expense ||
            !window.confirm("Are you sure you want to delete this expense?")
        )
            return;

        try {
            await dataService.expenses.deleteExpense(expense.id);
            navigate("/expenses");
        } catch (err) {
            console.error("Failed to delete expense:", err);
            alert("Failed to delete expense. Please try again.");
        }
    };

    const getUniquePersons = (participants: Participant[]): string[] => {
        return [...new Set(participants.map((p) => p.username))];
    };

    const calculatePersonTotal = (
        participants: Participant[],
        username: string,
    ): number => {
        return participants
            .filter((p) => p.username === username)
            .reduce((sum, p) => sum + p.amount, 0);
    };

    const findPayer = (participants: Participant[]): string | null => {
        const payer = participants.find((p) => p.is_payer);
        return payer ? payer.username : null;
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen p-4 max-w-md mx-auto">
                <div className="flex items-center mb-4">
                    <Button variant="ghost" size="sm" className="p-0 mr-2">
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-xl font-bold">Expense Details</h1>
                </div>
                <Card className="w-full shadow-sm">
                    <CardHeader className="pb-2">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-5 w-full mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !expense) {
        return (
            <div className="bg-gray-50 min-h-screen p-4 max-w-md mx-auto">
                <div className="flex items-center mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 mr-2"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-xl font-bold">Expense Details</h1>
                </div>
                <Card className="w-full shadow-sm p-4">
                    <div className="text-center py-8">
                        <p className="text-red-500 mb-4">
                            {error || "Expense not found"}
                        </p>
                        <Button onClick={() => navigate("/expenses")}>
                            Go back to expenses
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const payer =
        expense.paid_by || findPayer(expense.participants) || "Unknown";

    return (
        <div className="bg-gray-50 min-h-screen p-4 max-w-md mx-auto">
            <div className="flex items-center mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 mr-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={20} />
                </Button>
                <h1 className="text-xl font-bold">Expense Details</h1>
            </div>

            {expense.split_method === SplitMethod.EQUAL ? (
                <Card className="w-full shadow-sm mb-4">
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
                                    onClick={handleShareReceipt}
                                >
                                    <Share size={18} />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <div className="flex justify-between text-sm mb-4">
                            <span className="font-medium">Total:</span>
                            <span className="font-bold text-lg">
                                ₹{expense.total_amount.toFixed(2)}
                            </span>
                        </div>

                        <div className="bg-gray-100 p-3 rounded-md mb-4">
                            <div className="text-sm text-gray-700 mb-1">
                                <span className="font-semibold">
                                    Split Method:
                                </span>{" "}
                                {expense.split_method === "equal"
                                    ? "Equal Split"
                                    : "Custom Split"}
                            </div>
                            <div className="text-sm text-gray-700">
                                <span className="font-semibold">Paid by:</span>{" "}
                                {payer}
                            </div>
                        </div>

                        <h3 className="font-semibold mb-2 text-sm">
                            Participants
                        </h3>
                        <div className="space-y-2 divide-y divide-gray-100">
                            {getUniquePersons(expense.participants).map(
                                (username) => (
                                    <div
                                        key={username}
                                        className="flex justify-between py-2 text-sm"
                                    >
                                        <span
                                            className={
                                                username === payer
                                                    ? "font-medium"
                                                    : ""
                                            }
                                        >
                                            {username}{" "}
                                            {username === payer && "(Paid)"}
                                        </span>
                                        <span
                                            className={
                                                username === payer
                                                    ? "font-bold"
                                                    : "font-medium"
                                            }
                                        >
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

                        {expense.created_at && (
                            <div className="text-xs text-gray-400 mt-4 text-right">
                                Created:{" "}
                                {new Date(expense.created_at).toLocaleString()}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between pt-2 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditExpense}
                        >
                            <Pencil size={16} className="mr-1" /> Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteExpense}
                        >
                            <Trash size={16} className="mr-1" /> Delete
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <Card className="w-full shadow-sm">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="">
                                <CardTitle>{expense?.title}</CardTitle>
                                <CardDescription>
                                    {expense?.date}
                                </CardDescription>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleShareReceipt}
                                >
                                    <Share size={18} />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Person</TableHead>
                                    <TableHead>
                                        {expense?.participants[0].item &&
                                            "Item"}
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Amount
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expense?.participants?.map(
                                    (participant, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {participant.username}
                                            </TableCell>
                                            <TableCell>
                                                {participant.item &&
                                                    participant.item}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ₹{participant.amount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ),
                                )}
                                <TableRow>
                                    <TableCell
                                        colSpan={2}
                                        className="font-bold"
                                    >
                                        Total
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        ₹
                                        {calculateTotal(
                                            expense?.participants,
                                        ).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditExpense}
                        >
                            <Pencil size={16} className="mr-1" /> Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteExpense}
                        >
                            <Trash size={16} className="mr-1" /> Delete
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
};

export default ViewExpense;
