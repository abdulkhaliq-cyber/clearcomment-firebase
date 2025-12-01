import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import {
    EyeSlashIcon,
    EyeIcon,
    ChatBubbleLeftEllipsisIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const CommentsSection = ({ pageId }) => {
    const [comments, setComments] = useState([]);
    const [filteredComments, setFilteredComments] = useState([]);
    const [selectedComments, setSelectedComments] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL || 'http://localhost:3000';

    useEffect(() => {
        if (!pageId) return;

        setLoading(true);
        const commentsQuery = query(
            collection(db, 'comments'),
            where('pageId', '==', pageId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            setComments(commentsData);
            setFilteredComments(commentsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pageId]);

    useEffect(() => {
        let filtered = comments;

        if (filterStatus !== 'all') {
            filtered = filtered.filter(c => c.status === filterStatus);
        }

        if (searchTerm) {
            filtered = filtered.filter(comment =>
                comment.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                comment.fromName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredComments(filtered);
    }, [comments, filterStatus, searchTerm]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedComments(filteredComments.map(c => c.id));
        } else {
            setSelectedComments([]);
        }
    };

    const handleSelectComment = (commentId) => {
        setSelectedComments(prev =>
            prev.includes(commentId)
                ? prev.filter(id => id !== commentId)
                : [...prev, commentId]
        );
    };

    const handleBulkAction = async (action) => {
        try {
            const updates = selectedComments.map(commentId =>
                updateDoc(doc(db, 'comments', commentId), {
                    status: action === 'hide' ? 'hidden' : 'visible',
                    moderatedBy: 'manual'
                })
            );
            await Promise.all(updates);
            setSelectedComments([]);
            // In a real app, use a toast notification here
            console.log(`${selectedComments.length} comments ${action === 'hide' ? 'hidden' : 'unhidden'} successfully`);
        } catch (error) {
            console.error('Error performing bulk action:', error);
            alert('Error performing action');
        }
    };

    const handleSingleAction = async (commentId, action) => {
        try {
            await updateDoc(doc(db, 'comments', commentId), {
                status: action === 'hide' ? 'hidden' : 'visible',
                moderatedBy: 'manual'
            });
        } catch (error) {
            console.error('Error performing action:', error);
            alert('Error performing action');
        }
    };

    const handleSyncComments = async () => {
        if (!pageId) {
            alert('Please select a page first');
            return;
        }

        // Check if Railway URL is configured
        if (!RAILWAY_URL) {
            console.error('VITE_RAILWAY_URL is missing in environment variables');
            alert('Configuration Error: Backend URL is missing. Please check your .env file.');
            return;
        }

        try {
            setSyncing(true);
            const endpoint = `${RAILWAY_URL}/api/sync-comments`;
            console.log(`Syncing comments for page ${pageId} to ${endpoint}`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pageId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            alert(`Successfully synced ${result.count || 0} comments!`);
        } catch (error) {
            console.error('Error syncing comments:', error);
            alert(`Failed to sync comments: ${error.message}`);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Search comments..."
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                        >
                            <option value="all">All Status</option>
                            <option value="visible">Visible</option>
                            <option value="hidden">Hidden</option>
                        </select>
                    </div>
                    <button
                        onClick={handleSyncComments}
                        disabled={syncing}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl shadow-md text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all transform hover:scale-105"
                    >
                        <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
                        {syncing ? 'Syncing...' : 'Sync Comments'}
                    </button>
                </div>

                {selectedComments.length > 0 && (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <span className="text-sm text-gray-500 mr-2">
                            {selectedComments.length} selected
                        </span>
                        <button
                            onClick={() => handleBulkAction('hide')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <EyeSlashIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                            Hide
                        </button>
                        <button
                            onClick={() => handleBulkAction('unhide')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <EyeIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                            Unhide
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Author
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                                Comment
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredComments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-gray-300" />
                                    <p className="mt-2 text-sm font-medium text-gray-900">No comments found</p>
                                    <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredComments.map((comment) => (
                                <tr key={comment.id} className={`hover: bg - gray - 50 transition - colors ${selectedComments.includes(comment.id) ? 'bg-indigo-50' : ''} `}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedComments.includes(comment.id)}
                                            onChange={() => handleSelectComment(comment.id)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                                                {comment.fromName ? comment.fromName[0].toUpperCase() : '?'}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{comment.fromName || 'Unknown'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 break-words max-w-xl">{comment.message}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${comment.status === 'visible'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {comment.status}
                                        </span>
                                        {comment.actionTaken === 'ai-hide' && (
                                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                AI
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {comment.createdAt?.toLocaleDateString()}
                                        <span className="block text-xs text-gray-400">
                                            {comment.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => alert("Reply feature coming soon!")}
                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                                                title="Reply"
                                            >
                                                <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                                            </button>
                                            {comment.status === 'visible' ? (
                                                <button
                                                    onClick={() => handleSingleAction(comment.id, 'hide')}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                    title="Hide"
                                                >
                                                    <EyeSlashIcon className="h-5 w-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSingleAction(comment.id, 'unhide')}
                                                    className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                                                    title="Unhide"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommentsSection;
