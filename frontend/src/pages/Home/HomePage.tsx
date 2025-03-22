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

import dataService, {
    Expense,
    Participant,
    SplitMethod,
} from "@/services/dataService";
import ShareExpenseReceipt from "@/components/ShareExpenseReceipt";
import { Header, QuickStats, QuickOptions, BottomDrawer } from "./components";

function areAllElementsPresent<T>(array: T[], elementsToCheck: T[]): boolean {
    for (let i = 0; i < elementsToCheck.length; i++) {
        let found = false;
        for (let j = 0; j < array.length; j++) {
            if (array[j] === elementsToCheck[i]) {
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
    }
    return true;
}

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [isShareSheetOpen, setIsShareSheetOpen] = useState<boolean>(false);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
    const [, setActiveTab] = useState<"expenses" | "summary">("expenses");

    //fetching all expenses when component mounts
    useEffect(() => {
        fetchExpenses();
    }, []);

    //fetching expenses api
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

    /*
    //handle deleting an expense
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
    */

    //handle navigating to create expense page
    const handleCreateExpense = () => {
        navigate("/create-expense");
    };

    //handle navigating to expense detail page
    const handleViewExpenseDetail = (expenseId: string) => {
        navigate(`/expense/${expenseId}`);
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 max-w-md mx-auto">
            <Header />
            <QuickStats />
            <QuickOptions />

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
                        <div className="text-red-500 p-4 grid place-items-center">
                            {currentUser ? (
                                error
                            ) : (
                                <a
                                    href="/login"
                                    className="text-black underline"
                                >
                                    Log In first
                                </a>
                            )}
                        </div>
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
                        expenses.map((expense) => {
                            return expense.split_method ===
                                SplitMethod.EQUAL ? (
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
                                                        handleShareReceipt(
                                                            expense,
                                                        );
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
                                                ₹
                                                {expense.total_amount.toFixed(
                                                    2,
                                                )}
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
                            ) : (
                                <Card
                                    key={expense.id}
                                    className="w-full shadow-sm cursor-pointer"
                                    onClick={() =>
                                        handleViewExpenseDetail(expense.id)
                                    }
                                >
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="">
                                                <CardTitle>
                                                    {expense?.title}
                                                </CardTitle>
                                                <CardDescription>
                                                    {expense?.date}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShareReceipt(
                                                            expense,
                                                        );
                                                    }}
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
                                                    <TableHead>
                                                        Person
                                                    </TableHead>
                                                    <TableHead>
                                                        {expense
                                                            ?.participants[0]
                                                            .item && "Item"}
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
                                                                {
                                                                    participant.username
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {participant.item &&
                                                                    participant.item}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                ₹
                                                                {participant.amount.toFixed(
                                                                    2,
                                                                )}
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
                                </Card>
                            );
                        })
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
                                            <TableRow
                                                key={username}
                                                onClick={() => {
                                                    navigate(
                                                        `/expenses/${username}+${currentUser?.username}`,
                                                        {
                                                            state: expenses.filter(
                                                                (expense) =>
                                                                    areAllElementsPresent(
                                                                        expense.participants.map(
                                                                            (
                                                                                participant,
                                                                            ) =>
                                                                                participant.username,
                                                                        ),
                                                                        [
                                                                            currentUser?.username,
                                                                            username,
                                                                        ],
                                                                    ),
                                                            ),
                                                        },
                                                    );
                                                }}
                                            >
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
            <BottomDrawer />

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
