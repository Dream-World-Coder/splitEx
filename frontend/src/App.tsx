import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { Toaster } from "@/components/ui/sonner";

import AuthProvider from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoutes";

import HomePage from "./pages/Home/HomePage";
import ExpenseViewOthers from "./pages/Home/ShowOthersExpenses";
import CreateEditExpense from "./pages/Expenses/CreateExpense";
import ViewExpense from "./pages/Expenses/ViewExpense";

import Profile from "./pages/Profile/Profile";

import RegisterPage from "./pages/Auth/Register";
import LoginPage from "./pages/Auth/Login";

// import Profile from "./pages/Profile";
// import CalculateExpense from "./pages/CalculateExpense";
// import Groups from "./pages/Groups";
// import ScanFromOtherApps from "./pages/ScanFromOtherApps";

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/Register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/expenses" element={<HomePage />} />
                        <Route
                            path="/expenses/:username"
                            element={<ExpenseViewOthers />}
                        />
                        <Route
                            path="/create-expense"
                            element={<CreateEditExpense />}
                        />
                        <Route
                            path="/expense/edit/:expenseId"
                            element={<CreateEditExpense />}
                        />
                        <Route
                            path="/expense/:expenseId"
                            element={<ViewExpense />}
                        />
                        <Route path="/profile" element={<Profile />} />
                    </Route>

                    {/* <Route path="/groups" element={<Groups />} />
                <Route path="/scan-from-other-apps" element={<ScanFromOtherApps />} />  */}
                </Routes>
            </AuthProvider>
            <Toaster />
        </Router>
    );
};

export default App;
