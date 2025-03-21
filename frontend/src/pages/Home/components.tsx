import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Mic, Scan, ScanQrCode, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

import { useAuth } from "@/contexts/AuthContext";

export const Header: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    return (
        <header className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-black">SplitEx</h1>
                <p className="text-sm text-gray-500">
                    Expense Splitting Made Easy
                </p>
            </div>
            <div className="flex items-center justify-center gap-2">
                {/* account */}
                {currentUser ? (
                    <Avatar onClick={() => navigate("/profile")}>
                        <AvatarImage
                            src="https://opencanvas.blog/defaults/profile_1.jpeg"
                            alt="@user"
                        />
                        <AvatarFallback>SG</AvatarFallback>
                    </Avatar>
                ) : (
                    <div
                        className="bg-gray-200 size-9 rounded-full"
                        onClick={() => navigate("/login")}
                    ></div>
                )}

                {/* menubar */}
                <Sheet>
                    <SheetTrigger>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                        >
                            <Menu size={20} />
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[50%]">
                        <SheetHeader>
                            <SheetTitle className="text-lg font-semibold">
                                Menubar
                            </SheetTitle>
                            {["Home", "About", "Services", "Contact"].map(
                                (item) => (
                                    <SheetDescription
                                        key={item}
                                        className="text-base"
                                    >
                                        {item}
                                    </SheetDescription>
                                ),
                            )}
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
};

export const QuickStats: React.FC = () => {
    return (
        <Card className="flex flex-row items-center justify-center mb-0 shadow-none">
            <CardContent className="flex-1">
                {"₹0.00"}
                <pre className="font-sans text-sm">Total Balance</pre>
            </CardContent>
            <div className="flex items-center justify-center">
                <CardContent>
                    {"₹0.00"}
                    <pre className="font-sans text-sm">will get</pre>
                </CardContent>
                <CardContent>
                    {"₹0.00"}
                    <pre className="font-sans text-sm">will pay</pre>
                </CardContent>
            </div>
        </Card>
    );
};

export const QuickOptions: React.FC = () => {
    return (
        <Card className="mb-6 shadow-none border-none flex flex-row items-center justify-center bg-transparent">
            <CardContent className="border bg-card size-24 rounded-full flex flex-col items-center justify-center">
                <ScanQrCode />
                <pre className="font-sans text-xs">Pay</pre>
            </CardContent>
            <CardContent className="border bg-card size-24 rounded-full flex flex-col items-center justify-center">
                <Scan />
                <pre className="font-sans text-xs">Scan Bill</pre>
            </CardContent>
            <CardContent className="border bg-card size-24 rounded-full flex flex-col items-center justify-center">
                <Mic />
                <pre className="font-sans text-xs">Speak</pre>
            </CardContent>
        </Card>
    );
};

export const BottomDrawer: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Drawer>
            <DrawerTrigger>
                <Button className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg">
                    <Plus size={24} />
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader
                    className="border-b border-gray-200"
                    onClick={() => navigate("/create-expense")}
                >
                    <DrawerTitle>Calculate New Expense</DrawerTitle>
                    <DrawerDescription>Description</DrawerDescription>
                </DrawerHeader>
                <DrawerHeader className="border-b border-gray-200">
                    <DrawerTitle>
                        Scan created payment from other apps
                    </DrawerTitle>
                    <DrawerDescription>Description</DrawerDescription>
                </DrawerHeader>
                <DrawerHeader className="border-b border-gray-200 pb-12">
                    <DrawerTitle>Add expense to a group</DrawerTitle>
                    <DrawerDescription>Description</DrawerDescription>
                </DrawerHeader>
            </DrawerContent>
        </Drawer>
    );
};
