import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeftCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <div className="text-center text-gray-500">User not found</div>;
    }

    return (
        <div className="flex justify-center items-center h-fit p-4">
            <Card className="w-full max-w-sm rounded-lg min-h-screen border-none shadow-none">
                <CardHeader className="flex flex-row items-center justify-start gap-2">
                    <ChevronLeftCircle onClick={() => navigate(-1)} />
                    <CardTitle className="text-lg">Profile</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <p>
                        <strong>Username:</strong> {currentUser.username}
                    </p>
                    <p>
                        <strong>Name:</strong> {currentUser.name}
                    </p>
                    <p>
                        <strong>Email:</strong> {currentUser.email}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default Profile;
