import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import AnalyticsSection from './AnalyticsSection';
import CommentsSection from './CommentsSection';
import RulesSection from './RulesSection';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [pages, setPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [activeTab, setActiveTab] = useState('comments');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchUserPages(currentUser.uid);
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchUserPages = async (userId) => {
        try {
            const pagesQuery = query(
                collection(db, 'pages'),
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(pagesQuery);
            const pagesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setPages(pagesData);
            if (pagesData.length > 0) {
                setSelectedPage(pagesData[0]);
            }
        } catch (error) {
            console.error('Error fetching pages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">ClearComment</h1>
                            <p className="text-sm text-gray-600">Comment Moderation Dashboard</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.displayName || user?.email}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Selector */}
                {pages.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pages Connected</h3>
                        <p className="text-gray-600 mb-4">Connect your Facebook page to start moderating comments</p>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            Connect Facebook Page
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Page Selector Dropdown */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selected Page
                            </label>
                            <select
                                value={selectedPage?.id || ''}
                                onChange={(e) => {
                                    const page = pages.find(p => p.id === e.target.value);
                                    setSelectedPage(page);
                                }}
                                className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {pages.map(page => (
                                    <option key={page.id} value={page.id}>
                                        {page.name || page.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`${activeTab === 'comments'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Comments
                                </button>
                                <button
                                    onClick={() => setActiveTab('rules')}
                                    className={`${activeTab === 'rules'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Rules
                                </button>
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className={`${activeTab === 'analytics'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Analytics
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'comments' && <CommentsSection pageId={selectedPage?.id} />}
                        {activeTab === 'rules' && <RulesSection pageId={selectedPage?.id} />}
                        {activeTab === 'analytics' && <AnalyticsSection pageId={selectedPage?.id} />}
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
