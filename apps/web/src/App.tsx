import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { lazy, Suspense } from 'react';
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/player/Dashboard'));
const GroupView = lazy(() => import('./pages/player/GroupView'));
// Eliminado: GlobalClassification fusionado en GroupView
// const GlobalClassification = lazy(() => import('./pages/player/GlobalClassification'));
const RecordMatch = lazy(() => import('./pages/player/RecordMatch'));
const MatchHistory = lazy(() => import('./pages/player/MatchHistory'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageGroups = lazy(() => import('./pages/admin/ManageGroups'));
const ManageSeasons = lazy(() => import('./pages/admin/ManageSeasons'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageBugs = lazy(() => import('./pages/admin/ManageBugs'));
const SeasonProposals = lazy(() => import('./pages/admin/SeasonProposals'));
const BugReport = lazy(() => import('./pages/BugReport'));
const PlayerProgress = lazy(() => import('./pages/PlayerProgress'));
const Profile = lazy(() => import('./pages/player/Profile'));
const History = lazy(() => import('./pages/player/History'));
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
    const { isAuthenticated, isAdmin, loading, user } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg">Loading...</div>
        </div>;
    }

    const defaultRoute = isAdmin ? '/admin' : '/dashboard';

    return (
        <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-600">Cargando módulo...</div>}>
                <Routes>
                    {/* Public routes */}
                    <Route
                        path="/login"
                        element={!isAuthenticated ? <Login /> : <Navigate to={defaultRoute} replace />}
                    />
                    <Route
                        path="/register"
                        element={!isAuthenticated ? <Register /> : <Navigate to={defaultRoute} replace />}
                    />

                    {/* Protected player routes */}
                    <Route element={<Layout />}>
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    {isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />}
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
                            element={<Navigate to={user?.player?.currentGroup ? `/groups/${user.player.currentGroup.id}` : '/dashboard'} replace />}
                        />
                        <Route
                            path="/historia"
                            element={
                                <ProtectedRoute>
                                    <History />
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
                        <Route
                            path="/progress"
                            element={
                                <ProtectedRoute>
                                    <PlayerProgress />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/report-bug"
                            element={
                                <ProtectedRoute>
                                    <BugReport />
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
                            path="/admin/seasons"
                            element={
                                <ProtectedRoute adminOnly>
                                    <ManageSeasons />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/seasons/:seasonId/proposals"
                            element={
                                <ProtectedRoute adminOnly>
                                    <SeasonProposals />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute adminOnly>
                                    <ManageUsers />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/bugs"
                            element={
                                <ProtectedRoute adminOnly>
                                    <ManageBugs />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to={defaultRoute} replace />} />
                    <Route path="*" element={<Navigate to={defaultRoute} replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
