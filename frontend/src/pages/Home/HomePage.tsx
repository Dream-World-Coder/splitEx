import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Share, Plus } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import dataService, { Expense, Participant } from "@/services/dataService";
import ShareExpenseReceipt from "@/components/ShareExpenseReceipt";
import { Header, QuickStats, QuickOptions, BottomDrawer } from "./components";

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, token, refreshUser, login, logout } = useAuth();

    const [isShareSheetOpen, setIsShareSheetOpen] = useState<boolean>(false);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
    const [activeTab, setActiveTab] = useState<"expenses" | "summary">(
        "expenses",
    );

    // Fetch all expenses when component mounts
    useEffect(() => {
        fetchExpenses();
    }, []);

    // Fetch expenses from the API
    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const expensesData = await dataService.expenses.getAllExpenses();
            setExpenses(expensesData);
            setError(null);
        } catch (err) {
            console.error("Error fetching expenses:", err);
            setError("Failed to load expenses. Please try again later.");
            toast.error("Could not load expenses");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate total amount for an expense
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

    // Calculate total amount per person
    const calculatePersonTotal = (
        participants: Participant[],
        username: string,
    ): number => {
        return participants
            .filter((participant) => participant.username === username)
            .reduce((sum, participant) => sum + participant.amount, 0);
    };

    // Get unique persons from participants
    const getUniquePersons = (
        participants: Participant[] | undefined,
    ): string[] => {
        return [
            ...new Set(
                (participants ?? []).map((participant) => participant.username),
            ),
        ];
    };

    // Handle sharing an expense
    const handleShareReceipt = (expense: Expense) => {
        setCurrentExpense(expense);
        setIsShareSheetOpen(true);
    };

    // Handle deleting an expense
    const handleDeleteExpense = async (expenseId: string) => {
        try {
            await dataService.expenses.deleteExpense(expenseId);
            setExpenses((prevExpenses) =>
                prevExpenses.filter((expense) => expense.id !== expenseId),
            );
            toast.success("Expense deleted successfully");
        } catch (err) {
            console.error("Error deleting expense:", err);
            toast.error("Failed to delete expense");
        }
    };

    // Handle navigating to create expense page
    const handleCreateExpense = () => {
        navigate("/create-expense");
    };

    // Handle navigating to expense detail page
    const handleViewExpenseDetail = (expenseId: string) => {
        navigate(`/expense/${expenseId}`);
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 max-w-md mx-auto">
            <Header />
            <QuickStats expenses={expenses} />
            <QuickOptions onCreateExpense={handleCreateExpense} />

            <Tabs
                defaultValue="expenses"
                className="w-full mb-6"
                onValueChange={(value: string) =>
                    setActiveTab(value as "expenses" | "summary")
                }
            >
                <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            Loading expenses...
                        </div>
                    ) : error ? (
                        <div className="text-red-500 p-4">{error}</div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center p-6">
                            <p className="mb-4">
                                No expenses yet. Add one to get started!
                            </p>
                            <Button onClick={handleCreateExpense}>
                                <Plus className="mr-2" size={16} />
                                Add Expense
                            </Button>
                        </div>
                    ) : (
                        expenses.map((expense) => (
                            <Card
                                key={expense.id}
                                className="w-full shadow-sm cursor-pointer"
                                onClick={() =>
                                    handleViewExpenseDetail(expense.id)
                                }
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>
                                                {expense.title}
                                            </CardTitle>
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
                                        <span className="font-medium">
                                            Total:
                                        </span>
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
                                        {getUniquePersons(
                                            expense.participants,
                                        ).map((username) => (
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
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="summary">
                    <Card className="w-full shadow-sm">
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                            <CardDescription>
                                Who owes what, click for details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="p-4 text-center">
                                    Loading summary...
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Person</TableHead>
                                            <TableHead className="text-right">
                                                Total
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.from(
                                            new Set(
                                                expenses.flatMap((exp) =>
                                                    exp.participants?.map(
                                                        (participant) =>
                                                            participant.username,
                                                    ),
                                                ),
                                            ),
                                        ).map((username) => (
                                            <TableRow key={username}>
                                                <TableCell>
                                                    {username}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ₹
                                                    {expenses
                                                        .reduce(
                                                            (sum, exp) =>
                                                                sum +
                                                                calculatePersonTotal(
                                                                    exp.participants,
                                                                    username,
                                                                ),
                                                            0,
                                                        )
                                                        .toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* bottom drawer */}
            <BottomDrawer onCreateExpense={handleCreateExpense} />

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

export default HomePage;
