import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/player/Dashboard';
import GroupView from './pages/player/GroupView';
import GlobalClassification from './pages/player/GlobalClassification';
import RecordMatch from './pages/player/RecordMatch';
import MatchHistory from './pages/player/MatchHistory';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageGroups from './pages/admin/ManageGroups';
import ManagePlayers from './pages/admin/ManagePlayers';
import ManageSeasons from './pages/admin/ManageSeasons';
import Layout from './components/Layout';

function ProtectedRoute({
    children,
    adminOnly = false
}: {
    children: React.ReactNode;
    adminOnly?: boolean;
}) {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg">Loading...</div>
        </div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

function App() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg">Loading...</div>
        </div>;
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/register"
                    element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />}
                />

                {/* Protected player routes */}
                <Route element={<Layout />}>
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/groups/:id"
                        element={
                            <ProtectedRoute>
                                <GroupView />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/classification"
                        element={
                            <ProtectedRoute>
                                <GlobalClassification />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/matches/record"
                        element={
                            <ProtectedRoute>
                                <RecordMatch />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/matches/history"
                        element={
                            <ProtectedRoute>
                                <MatchHistory />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin routes */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/groups"
                        element={
                            <ProtectedRoute adminOnly>
                                <ManageGroups />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/players"
                        element={
                            <ProtectedRoute adminOnly>
                                <ManagePlayers />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/seasons"
                        element={
                            <ProtectedRoute adminOnly>
                                <ManageSeasons />
                            </ProtectedRoute>
                        }
                    />
                </Route>

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
