// save the expense
const handleSave = async () => {
    if (!title) {
        toast.error("Please enter a title for the expense");
        return;
    }

    if (splitMode === SplitMethod.EQUAL) {
        if (participants.length < 2) {
            toast.error(
                "Please add at least 2 participants for equal splitting",
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
            // create new expense
            const newExpenseId =
                await dataService.expenses.createExpense(expenseData);

            // add participants
            if (splitMode === SplitMethod.EQUAL) {
                const perPersonAmount = expenseTotal / participants.length;

                // add participants one by one
                for (const username of participants) {
                    await dataService.participants.addParticipant(
                        newExpenseId,
                        {
                            username,
                            amount: perPersonAmount,
                            item: "Equal share",
                        },
                    );
                }
            } else {
                // add custom entries
                for (const entry of participantEntries) {
                    await dataService.participants.addParticipant(
                        newExpenseId,
                        {
                            username: entry.username.toLowerCase(),
                            amount: entry.amount,
                            item: entry.item,
                        },
                    );
                }
            }

            toast.success("Expense created successfully");
        } else if (expenseId) {
            // update existing expense
            await dataService.expenses.updateExpense(expenseId, expenseData);

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
                }
            } else {
                // for custom split, replace all participants
                // first remove all existing participants
                for (const participant of currentParticipants) {
                    await dataService.participants.removeParticipant(
                        expenseId,
                        participant.username.toLowerCase(),
                    );
                }

                // then add all new entries
                for (const entry of participantEntries) {
                    await dataService.participants.addParticipant(expenseId, {
                        username: entry.username.toLowerCase(),
                        amount: entry.amount,
                        item: entry.item,
                    });
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
