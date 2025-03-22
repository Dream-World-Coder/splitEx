import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, ChevronLeftCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
// import { useAuth } from "@/contexts/AuthContext";
import dataService, {
    SplitMethod,
    Participant,
    CreateExpensePayload,
} from "@/services/dataService";

interface NewParticipantEntry {
    username: string;
    item: string;
    amount: string;
}

const CreateEditExpense: React.FC = () => {
    const navigate = useNavigate();
    const { expenseId } = useParams<{ expenseId: string }>();
    // const { currentUser } = useAuth();
    const mode = expenseId ? "edit" : "create";

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [splitMode, setSplitMode] = useState<SplitMethod>(SplitMethod.EQUAL);
    const [title, setTitle] = useState<string>("");
    const [date, setDate] = useState<string>(
        new Date().toISOString().split("T")[0],
    );
    const [totalAmount, setTotalAmount] = useState<string>("");
    const [participants, setParticipants] = useState<string[]>([]);
    const [participantEntries, setParticipantEntries] = useState<Participant[]>(
        [],
    );
    const [newUsername, setNewUsername] = useState<string>("");
    const [newEntry, setNewEntry] = useState<NewParticipantEntry>({
        username: "",
        item: "",
        amount: "",
    });

    // fetch expense data if editing
    useEffect(() => {
        if (mode === "edit" && expenseId) {
            fetchExpenseData(expenseId);
        }
    }, [expenseId, mode]);

    const fetchExpenseData = async (id: string) => {
        setIsLoading(true);
        try {
            const expense = await dataService.expenses.getExpenseById(id);
            setTitle(expense.title);
            setDate(expense.date);
            setTotalAmount(expense.total_amount.toString());
            setSplitMode(expense.split_method);

            // extract participants for equal split
            if (expense.split_method === SplitMethod.EQUAL) {
                setParticipants(
                    expense.participants.map((p) => p.username.toLowerCase()),
                );
            } else {
                setParticipantEntries(expense.participants);
            }
        } catch (error) {
            console.error("Error fetching expense:", error);
            toast.error("Failed to load expense details");
        } finally {
            setIsLoading(false);
        }
    };

    // calculate total from entries
    const calculateTotal = (entries: Participant[]): number => {
        if (!entries || entries.length === 0) return 0;
        return entries.reduce((sum, entry) => sum + entry.amount, 0);
    };

    // handle split mode change
    const handleSplitModeChange = (value: string) => {
        setSplitMode(value as SplitMethod);
        // reset related fields when changing split mode
        if (value === SplitMethod.EQUAL) {
            setParticipantEntries([]);
        } else {
            setParticipants([]);
        }
    };

    // add new participant for equal split
    const handleAddParticipant = () => {
        if (newUsername && !participants.includes(newUsername)) {
            setParticipants((prev) => [...prev, newUsername]);
            setNewUsername("");
        }
    };

    // remove a participant from equal split
    const handleRemoveParticipant = (index: number) => {
        setParticipants((prev) => prev.filter((_, i) => i !== index));
    };

    // add new entry for custom split
    const handleAddEntry = () => {
        if (
            newEntry.username &&
            (splitMode === SplitMethod.EQUAL || newEntry.item) &&
            newEntry.amount
        ) {
            const amount = parseFloat(newEntry.amount);
            if (isNaN(amount) || amount <= 0) {
                toast.error("Please enter a valid amount");
                return;
            }

            setParticipantEntries((prev) => [
                ...prev,
                {
                    username: newEntry.username.toLowerCase(),
                    item:
                        splitMode === SplitMethod.EQUAL
                            ? "Equal share"
                            : newEntry.item,
                    amount: amount,
                },
            ]);

            setNewEntry({ username: "", item: "", amount: "" });
        } else {
            toast.error("Please fill in all fields");
        }
    };

    // remove an entry from custom split
    const handleRemoveEntry = (index: number) => {
        setParticipantEntries((prev) => prev.filter((_, i) => i !== index));
    };

    // save the expense
    const handleSave = async () => {
        if (!title) {
            toast.error("Please enter a title for the expense");
            return;
        }

        if (splitMode === SplitMethod.EQUAL) {
            if (participants.length < 1) {
                toast.error(
                    "Please add at least 1 participant for equal splitting",
                );
                return;
            }

            const total = parseFloat(totalAmount);
            if (isNaN(total) || total <= 0) {
                toast.error("Please enter a valid total amount");
                return;
            }
        } else {
            if (participantEntries.length === 0) {
                toast.error("Please add at least one expense entry");
                return;
            }
        }

        setIsLoading(true);

        try {
            let expenseTotal: number;

            if (splitMode === SplitMethod.EQUAL) {
                expenseTotal = parseFloat(totalAmount);
            } else {
                expenseTotal = calculateTotal(participantEntries);
            }

            const expenseData: CreateExpensePayload = {
                title,
                total_amount: expenseTotal,
                date,
                split_method: splitMode,
            };

            if (mode === "create") {
                try {
                    // create new expense
                    const newExpenseId =
                        await dataService.expenses.createExpense(expenseData);

                    // add participants
                    if (splitMode === SplitMethod.EQUAL) {
                        const perPersonAmount =
                            expenseTotal / participants.length;

                        // add participants one by one
                        for (const username of participants) {
                            try {
                                await dataService.participants.addParticipant(
                                    newExpenseId,
                                    {
                                        username,
                                        amount: perPersonAmount,
                                        item: "Equal share",
                                    },
                                );
                            } catch (participantError) {
                                // If adding a participant fails, delete the expense and stop
                                console.error(
                                    "Failed to add participant:",
                                    participantError,
                                );
                                await dataService.expenses.deleteExpense(
                                    newExpenseId,
                                );
                                toast.error(
                                    `Failed to add participant ${username}. The expense has been deleted.`,
                                );
                                setIsLoading(false);
                                return;
                            }
                        }
                    } else {
                        // add custom entries
                        for (const entry of participantEntries) {
                            try {
                                await dataService.participants.addParticipant(
                                    newExpenseId,
                                    {
                                        username: entry.username.toLowerCase(),
                                        amount: entry.amount,
                                        item: entry.item,
                                    },
                                );
                            } catch (participantError) {
                                // if adding a participant fails, delete the expense and stop
                                console.error(
                                    "Failed to add participant:",
                                    participantError,
                                );
                                await dataService.expenses.deleteExpense(
                                    newExpenseId,
                                );
                                toast.error(
                                    `Failed to add participant ${entry.username}. The expense has been deleted.`,
                                );
                                setIsLoading(false);
                                return;
                            }
                        }
                    }

                    toast.success("Expense created successfully");
                } catch (expenseError) {
                    console.error("Error creating expense:", expenseError);
                    toast.error("Failed to create expense. Please try again.");
                    setIsLoading(false);
                    return;
                }
            } else if (expenseId) {
                // update existing expense
                await dataService.expenses.updateExpense(
                    expenseId,
                    expenseData,
                );

                // get current participants to compare
                const currentParticipants =
                    await dataService.participants.getExpenseParticipants(
                        expenseId,
                    );

                if (splitMode === SplitMethod.EQUAL) {
                    const perPersonAmount = expenseTotal / participants.length;

                    // remove participants who are no longer included
                    for (const participant of currentParticipants) {
                        if (
                            !participants.includes(
                                participant.username.toLowerCase(),
                            )
                        ) {
                            await dataService.participants.removeParticipant(
                                expenseId,
                                participant.username.toLowerCase(),
                            );
                        }
                    }

                    // add or update remaining participants
                    for (const username of participants) {
                        try {
                            const existing = currentParticipants.find(
                                (p) => p.username === username.toLowerCase(),
                            );

                            if (existing) {
                                // update amount
                                await dataService.participants.updateParticipant(
                                    expenseId,
                                    username,
                                    {
                                        amount: perPersonAmount,
                                        item: "Equal share",
                                    },
                                );
                            } else {
                                // add new participant
                                await dataService.participants.addParticipant(
                                    expenseId,
                                    {
                                        username,
                                        amount: perPersonAmount,
                                        item: "Equal share",
                                    },
                                );
                            }
                        } catch (participantError) {
                            console.error(
                                "Failed to add/update participant:",
                                participantError,
                            );
                            toast.error(
                                `Failed to add/update participant ${username}. Please try again.`,
                            );
                            setIsLoading(false);
                            return;
                        }
                    }
                } else {
                    // For custom split, we'll use a transaction-like approach
                    // First store all existing participants in case we need to restore them
                    const backupParticipants = [...currentParticipants];
                    let participantUpdateFailed = false;

                    try {
                        // Remove all existing participants
                        for (const participant of currentParticipants) {
                            await dataService.participants.removeParticipant(
                                expenseId,
                                participant.username.toLowerCase(),
                            );
                        }

                        // Add all new entries
                        for (const entry of participantEntries) {
                            try {
                                await dataService.participants.addParticipant(
                                    expenseId,
                                    {
                                        username: entry.username.toLowerCase(),
                                        amount: entry.amount,
                                        item: entry.item,
                                    },
                                );
                            } catch (error) {
                                participantUpdateFailed = true;
                                throw error; // Propagate to the catch block
                            }
                        }
                    } catch (error) {
                        console.error(
                            "Failed during participant updates:",
                            error,
                        );

                        if (participantUpdateFailed) {
                            // Try to restore original participants
                            try {
                                // First remove any participants that might have been added
                                const currentList =
                                    await dataService.participants.getExpenseParticipants(
                                        expenseId,
                                    );
                                for (const participant of currentList) {
                                    await dataService.participants.removeParticipant(
                                        expenseId,
                                        participant.username.toLowerCase(),
                                    );
                                }

                                // Restore original participants
                                for (const participant of backupParticipants) {
                                    await dataService.participants.addParticipant(
                                        expenseId,
                                        {
                                            username:
                                                participant.username.toLowerCase(),
                                            amount: participant.amount,
                                            item: participant.item,
                                        },
                                    );
                                }
                                toast.error(
                                    "Failed to update participants. Original expense has been restored.",
                                );
                            } catch (restoreError) {
                                console.error(
                                    "Failed to restore original participants:",
                                    restoreError,
                                );
                                // If restoring fails, delete the expense as a last resort
                                await dataService.expenses.deleteExpense(
                                    expenseId,
                                );
                                toast.error(
                                    "Failed to update participants. The expense has been deleted to maintain data integrity.",
                                );
                            }
                        }

                        setIsLoading(false);
                        return;
                    }
                }

                toast.success("Expense updated successfully");
            }

            navigate("/");
        } catch (error) {
            console.error("Error saving expense:", error);
            toast.error("Failed to save expense. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white">
            <Card className="shadow-none border-none min-h-screen rounded-none">
                <CardHeader>
                    <CardTitle className="flex flex-row items-center justify-start gap-2">
                        <ChevronLeftCircle
                            size={20}
                            onClick={() => navigate(-1)}
                            className="cursor-pointer"
                        />
                        {mode === "edit"
                            ? "Edit Expense"
                            : "Create New Expense"}
                    </CardTitle>
                    <CardDescription>
                        {splitMode === SplitMethod.EQUAL
                            ? "Split the total equally among participants"
                            : "Create custom entries for each expense item"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            Loading...
                        </div>
                    ) : (
                        <>
                            {/* Basic Info */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Dinner, groceries, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            {/* Split Mode Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="splitMode">Split Method</Label>
                                <Select
                                    value={splitMode}
                                    onValueChange={handleSplitModeChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select split method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={SplitMethod.EQUAL}>
                                            Split Equally
                                        </SelectItem>
                                        <SelectItem value={SplitMethod.UNEQUAL}>
                                            Custom Split
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Equal Split UI */}
                            {splitMode === SplitMethod.EQUAL && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="totalAmount">
                                            Total Amount
                                        </Label>
                                        <Input
                                            id="totalAmount"
                                            type="number"
                                            placeholder="₹0.00"
                                            value={totalAmount}
                                            onChange={(e) =>
                                                setTotalAmount(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>Participants</Label>
                                            {participants.length > 0 &&
                                                totalAmount && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        ₹
                                                        {(
                                                            parseFloat(
                                                                totalAmount,
                                                            ) /
                                                            participants.length
                                                        ).toFixed(2)}{" "}
                                                        per person
                                                    </Badge>
                                                )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add participant [username]"
                                                value={newUsername.toLowerCase()}
                                                onChange={(e) =>
                                                    setNewUsername(
                                                        e.target.value.toLowerCase(),
                                                    )
                                                }
                                                className="flex-1"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleAddParticipant}
                                                className="px-2"
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        </div>

                                        <div className="border rounded-md p-2 min-h-20">
                                            <div className="flex flex-wrap gap-2">
                                                {participants.map(
                                                    (username, index) => (
                                                        <Badge
                                                            key={index}
                                                            className="px-2 py-1 flex items-center gap-1"
                                                        >
                                                            {username}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveParticipant(
                                                                        index,
                                                                    )
                                                                }
                                                                className="h-4 w-4 p-0 ml-1"
                                                            >
                                                                <Trash
                                                                    size={12}
                                                                />
                                                            </Button>
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Custom Split UI */}
                            {splitMode === SplitMethod.UNEQUAL && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>Expense Items</Label>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            Total: ₹
                                            {calculateTotal(
                                                participantEntries,
                                            ).toFixed(2)}
                                        </Badge>
                                    </div>

                                    {participantEntries.length > 0 ? (
                                        <div className="border rounded-md">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Person
                                                        </TableHead>
                                                        <TableHead>
                                                            Item
                                                        </TableHead>
                                                        <TableHead>
                                                            Amount
                                                        </TableHead>
                                                        <TableHead className="w-8"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {participantEntries.map(
                                                        (entry, index) => (
                                                            <TableRow
                                                                key={index}
                                                            >
                                                                <TableCell className="py-2">
                                                                    {entry.username.toLowerCase()}
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    {entry.item}
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    ₹
                                                                    {entry.amount.toFixed(
                                                                        2,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleRemoveEntry(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="p-0 h-8 w-8"
                                                                    >
                                                                        <Trash
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="border rounded-md p-4 text-center text-gray-500">
                                            No items added yet
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <Input
                                            placeholder="Person"
                                            value={newEntry.username.toLowerCase()}
                                            onChange={(e) =>
                                                setNewEntry({
                                                    ...newEntry,
                                                    username: e.target.value,
                                                })
                                            }
                                            className="flex-1"
                                        />
                                        <Input
                                            placeholder="Item"
                                            value={newEntry.item}
                                            onChange={(e) =>
                                                setNewEntry({
                                                    ...newEntry,
                                                    item: e.target.value,
                                                })
                                            }
                                            className="flex-1"
                                        />
                                        <Input
                                            placeholder="₹0.00"
                                            type="number"
                                            value={newEntry.amount}
                                            onChange={(e) =>
                                                setNewEntry({
                                                    ...newEntry,
                                                    amount: e.target.value,
                                                })
                                            }
                                            className="w-24"
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleAddEntry}
                                            className="px-2"
                                        >
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Expense"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default CreateEditExpense;
