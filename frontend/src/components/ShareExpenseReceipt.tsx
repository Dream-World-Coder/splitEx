import React from "react";
import { Share, ArrowDownFromLine } from "lucide-react";
import jsPDF from "jspdf";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShareExpenseReceiptProps } from "@/types";

const ShareExpenseReceipt: React.FC<ShareExpenseReceiptProps> = ({
    isShareSheetOpen,
    setIsShareSheetOpen,
    currentExpense,
    calculateTotal,
    getUniquePersons,
    calculatePersonTotal,
}) => {
    const handleDownload = async () => {
        if (!currentExpense) return;

        try {
            // Step 1: Create a new PDF document
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            // Step 2: Set up PDF dimensions and margins
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            let yPosition = margin;

            // Step 3: Add title and date
            pdf.setFontSize(18);
            pdf.setFont("helvetica", "bold");
            pdf.text(
                currentExpense.title || "Expense Receipt",
                margin,
                yPosition,
            );
            yPosition += 10;

            // Step 4: Add date if available
            if (currentExpense.date) {
                pdf.setFontSize(12);
                pdf.setFont("helvetica", "normal");
                pdf.text(currentExpense.date, margin, yPosition);
                yPosition += 15;
            } else {
                yPosition += 10;
            }

            // Step 5: Add items table header
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");

            // Table headers
            const headers = ["Person", "Item", "Amount"];
            const colWidths = [
                contentWidth * 0.3,
                contentWidth * 0.4,
                contentWidth * 0.3,
            ];
            const colPositions = [
                margin,
                margin + colWidths[0],
                margin + colWidths[0] + colWidths[1],
            ];

            // Draw header row
            pdf.text(headers[0], colPositions[0], yPosition);
            pdf.text(headers[1], colPositions[1], yPosition);
            pdf.text(
                headers[2],
                colPositions[2] + colWidths[2] - 25,
                yPosition,
                { align: "right" },
            );
            yPosition += 5;

            // Draw header separator line
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPosition, margin + contentWidth, yPosition);
            yPosition += 8;

            // Step 6: Add table content
            pdf.setFont("helvetica", "normal");

            if (currentExpense.entries && currentExpense.entries.length > 0) {
                // Process each entry in the expense
                for (const entry of currentExpense.entries) {
                    // Check if we need a new page
                    if (yPosition > 270) {
                        pdf.addPage();
                        yPosition = margin + 10;
                    }

                    const amountText = `$${entry.amount.toFixed(2)}`;

                    pdf.text(entry.person || "", colPositions[0], yPosition);
                    pdf.text(entry.item || "", colPositions[1], yPosition);
                    pdf.text(
                        amountText,
                        colPositions[2] + colWidths[2] - 15,
                        yPosition,
                        { align: "right" },
                    );

                    yPosition += 8;
                }
            }

            // Draw total separator line
            yPosition += 2;
            pdf.setDrawColor(150, 150, 150);
            pdf.line(margin, yPosition, margin + contentWidth, yPosition);
            yPosition += 8;

            // Step 7: Add total
            pdf.setFont("helvetica", "bold");
            const totalAmount = calculateTotal(currentExpense.entries);
            const totalText = `₹${totalAmount.toFixed(2)}`;

            pdf.text("Total", colPositions[0], yPosition);
            pdf.text(
                totalText,
                colPositions[2] + colWidths[2] - 15,
                yPosition,
                { align: "right" },
            );
            yPosition += 15;

            // Step 8: Add summary by person section
            pdf.text("Summary by Person", margin, yPosition);
            yPosition += 8;

            pdf.setFont("helvetica", "normal");

            const uniquePersons = getUniquePersons(currentExpense.entries);
            for (const person of uniquePersons) {
                // Check if we need a new page
                if (yPosition > 270) {
                    pdf.addPage();
                    yPosition = margin + 10;
                }

                const personTotal = calculatePersonTotal(
                    currentExpense.entries || [],
                    person,
                );
                const personTotalText = `₹${personTotal.toFixed(2)}`;

                pdf.text(person, margin, yPosition);
                pdf.text(
                    personTotalText,
                    margin + contentWidth - 15,
                    yPosition,
                    { align: "right" },
                );
                yPosition += 8;
            }

            // Step 9: Generate a safe filename from the expense title
            let fileName = currentExpense.title || "Expense_Receipt";
            // Remove special characters except underscores and hyphens
            fileName = fileName.replace(/[^a-zA-Z0-9_-]/g, "_");

            // Add date to filename if available
            if (currentExpense.date) {
                const formattedDate = currentExpense.date.replace(
                    /[^0-9]/g,
                    "",
                );
                fileName = `${fileName}_${formattedDate}`;
            }

            // Step 10: Save the PDF
            pdf.save(`${fileName}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    return (
        <Sheet open={isShareSheetOpen} onOpenChange={setIsShareSheetOpen}>
            <SheetContent className="w-full">
                <SheetHeader>
                    <SheetTitle>Share Receipt</SheetTitle>
                    <SheetDescription>
                        Share the expense breakdown with others
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 px-2">
                    <Card id="receipt">
                        <CardHeader>
                            <CardTitle>{currentExpense?.title}</CardTitle>
                            <CardDescription>
                                {currentExpense?.date}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Person</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentExpense?.entries?.map(
                                        (entry, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {entry.person}
                                                </TableCell>
                                                <TableCell>
                                                    {entry.item}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ${entry.amount.toFixed(2)}
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
                                                currentExpense?.entries,
                                            ).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            <div className="mt-4 space-y-2">
                                <h3 className="font-medium">
                                    Summary by Person
                                </h3>
                                {getUniquePersons(currentExpense?.entries).map(
                                    (person) => (
                                        <div
                                            key={person}
                                            className="flex justify-between"
                                        >
                                            <span>{person}</span>
                                            <span>
                                                ₹
                                                {calculatePersonTotal(
                                                    currentExpense?.entries ??
                                                        [],
                                                    person,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <SheetFooter className="flex flex-row items-center justify-center gap-2">
                    <Button className="flex-1">
                        <Share size={16} />
                        Share Receipt
                    </Button>
                    <Button className="flex-1" onClick={handleDownload}>
                        <ArrowDownFromLine size={16} />
                        Download
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default ShareExpenseReceipt;
