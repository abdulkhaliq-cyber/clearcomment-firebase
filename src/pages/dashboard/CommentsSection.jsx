import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';

const CommentsSection = ({ pageId }) => {
    const [comments, setComments] = useState([]);
    const [filteredComments, setFilteredComments] = useState([]);
    const [selectedComments, setSelectedComments] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

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

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(c => c.status === filterStatus);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
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
            alert(`${selectedComments.length} comments ${action === 'hide' ? 'hidden' : 'unhidden'} successfully`);
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

    if (loading) {
        return <div className="text-center py-8">Loading comments...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Status
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All</option>
                            <option value="visible">Visible</option>
                            <option value="hidden">Hidden</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by content or author..."
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedComments.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-900">
                        {selectedComments.length} comment(s) selected
                    </span>
                    <div className="space-x-2">
                        <button
                            onClick={() => handleBulkAction('hide')}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                            Hide Selected
                        </button>
                        <button
                            onClick={() => handleBulkAction('unhide')}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                            Unhide Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Comments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Author
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Comment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredComments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    No comments found
                                </td>
                            </tr>
                        ) : (
                            filteredComments.map((comment) => (
                                <tr key={comment.id} className={selectedComments.includes(comment.id) ? 'bg-indigo-50' : ''}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedComments.includes(comment.id)}
                                            onChange={() => handleSelectComment(comment.id)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{comment.authorName || 'Unknown'}</div>
                                        <div className="text-sm text-gray-500">{comment.authorId}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-md truncate">{comment.content}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${comment.status === 'visible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {comment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {comment.createdAt?.toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        {comment.status === 'visible' ? (
                                            <button
                                                onClick={() => handleSingleAction(comment.id, 'hide')}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Hide
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSingleAction(comment.id, 'unhide')}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Unhide
                                            </button>
                                        )}
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
