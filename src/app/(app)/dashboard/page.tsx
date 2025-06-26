import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Settings } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Main Content */}
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Welcome to your Dashboard</h2>
                    <p className="text-muted-foreground">
                        Manage your files and account settings from here.
                    </p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Upload Files
                            </CardTitle>
                            <CardDescription>
                                Upload and manage your files in the cloud
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Files
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                My Files
                            </CardTitle>
                            <CardDescription>
                                Browse and organize your uploaded files
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">
                                <FileText className="h-4 w-4 mr-2" />
                                Browse Files
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Settings
                            </CardTitle>
                            <CardDescription>
                                Manage your account and preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">
                                <Settings className="h-4 w-4 mr-2" />
                                Account Settings
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Storage Usage */}
                <Card>
                    <CardHeader>
                        <CardTitle>Storage Usage</CardTitle>
                        <CardDescription>
                            Monitor your storage usage and upgrade when needed
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Used</span>
                                <span className="text-sm font-medium">0 MB of 1 GB</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }}></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Free tier</span>
                                <Button variant="outline" size="sm">
                                    Upgrade Plan
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}