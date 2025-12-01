import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore';
import { signOut, FacebookAuthProvider, signInWithPopup, linkWithPopup } from 'firebase/auth';
import AnalyticsSection from './AnalyticsSection';
import CommentsSection from './CommentsSection';
import RulesSection from './RulesSection';
import DashboardLayout from '../../components/DashboardLayout';
import { PlusIcon } from '@heroicons/react/20/solid';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [pages, setPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // Default to overview/analytics
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [showPageSelectionModal, setShowPageSelectionModal] = useState(false);
    const [availablePages, setAvailablePages] = useState([]);

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
                where('connectedBy', '==', userId)
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

    const handleConnectPage = async () => {
        console.log("Connect Page button clicked");
        setConnecting(true);

        // Check if FB SDK is loaded
        if (!window.FB) {
            console.error("Facebook SDK not found on window object");
            alert("Facebook SDK is not loaded. This might be due to an ad blocker. Please disable ad blockers and refresh the page.");
            setConnecting(false);
            return;
        }

        console.log("Initiating FB.login...");
        window.FB.login((response) => {
            // Wrap async logic in an IIFE (Immediately Invoked Function Expression)
            // because FB SDK might not like async callbacks directly
            (async () => {
                console.log("FB.login response:", response);
                if (response.authResponse) {
                    const accessToken = response.authResponse.accessToken;

                    try {
                        const apiResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
                        const data = await apiResponse.json();

                        if (data.data && data.data.length > 0) {
                            setAvailablePages(data.data);
                            setShowPageSelectionModal(true);
                        } else {
                            alert("No Facebook Pages found for this account.");
                        }
                    } catch (error) {
                        console.error("Error fetching pages:", error);
                        alert("Failed to fetch pages: " + error.message);
                    }
                } else {
                    console.log('User cancelled login or did not fully authorize.');
                }
                setConnecting(false);
            })();
        }, {
            scope: 'pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_posts,pages_manage_engagement'
        });
    };

    const handleSelectPage = async (page) => {
        try {
            const pageData = {
                pageId: page.id,
                pageName: page.name,
                pageToken: page.access_token,
                connectedBy: user.uid,
                connectedAt: new Date(),
                webhookStatus: 'disabled', // Will be set to 'active' when webhook is configured
                autoModeration: false // Default to off, user can enable later
            };

            await setDoc(doc(db, 'pages', page.id), pageData);

            setPages(prev => {
                const filtered = prev.filter(p => p.pageId !== page.id);
                return [...filtered, pageData];
            });
            setSelectedPage(pageData);
            setShowPageSelectionModal(false);
            alert(`Successfully connected page: ${page.name}`);
        } catch (error) {
            console.error("Error saving page:", error);
            alert("Failed to save page connection.");
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
        <DashboardLayout user={user} activeTab={activeTab} onTabChange={setActiveTab}>
            {/* Page Selection Modal */}
            {showPageSelectionModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Select a Page to Connect</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {availablePages.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => handleSelectPage(page)}
                                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <div className="font-medium text-gray-900">{page.name}</div>
                                    <div className="text-sm text-gray-500">{page.category}</div>
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowPageSelectionModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {pages.length === 0 ? (
                <div className="text-center py-20">
                    <div className="mx-auto h-32 w-32 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-pulse-slow">
                        <PlusIcon className="h-16 w-16 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-3">No Pages Connected</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">Connect your Facebook page to start moderating comments automatically with AI and custom rules.</p>
                    <button
                        onClick={handleConnectPage}
                        disabled={connecting}
                        className="inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-2xl shadow-xl text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all transform hover:scale-105"
                    >
                        {connecting ? 'Connecting...' : 'Connect Facebook Page'}
                    </button>
                </div>
            ) : (
                <>
                    {/* Page Selector & Actions */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="w-full max-w-xs">
                            <label className="block text-xs font-semibold text-primary-700 uppercase tracking-wider mb-2">
                                Selected Page
                            </label>
                            <select
                                value={selectedPage?.pageId || ''}
                                onChange={(e) => {
                                    const page = pages.find(p => p.pageId === e.target.value);
                                    setSelectedPage(page);
                                }}
                                className="block w-full pl-4 pr-10 py-3 text-base border-2 border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-xl shadow-sm bg-white font-medium text-gray-900"
                            >
                                {pages.map(page => (
                                    <option key={page.pageId} value={page.pageId}>
                                        {page.pageName || page.pageId}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleConnectPage}
                            disabled={connecting}
                            className="inline-flex items-center px-6 py-3 border-2 border-primary-200 shadow-md text-sm font-semibold rounded-xl text-primary-700 bg-white hover:bg-primary-50 hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all transform hover:scale-105"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5 text-primary-600" aria-hidden="true" />
                            Connect Another Page
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-primary-100 overflow-hidden min-h-[500px]">
                        {(activeTab === 'comments') && <CommentsSection pageId={selectedPage?.pageId} />}
                        {(activeTab === 'rules') && <RulesSection pageId={selectedPage?.pageId} />}
                        {(activeTab === 'analytics' || activeTab === 'overview') && <AnalyticsSection pageId={selectedPage?.pageId} />}
                    </div>
                </>
            )}
        </DashboardLayout>
    );
};

export default Dashboard;
