import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const RulesSection = ({ pageId }) => {
    const [rules, setRules] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newRule, setNewRule] = useState({
        type: 'hide',
        keyword: '',
        replyText: '',
        isEnabled: true
    });

    useEffect(() => {
        if (!pageId) return;

        const rulesQuery = query(
            collection(db, 'rules'),
            where('pageId', '==', pageId)
        );

        const unsubscribe = onSnapshot(rulesQuery, (snapshot) => {
            const rulesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRules(rulesData);
        });

        return () => unsubscribe();
    }, [pageId]);

    const handleCreateRule = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'rules'), {
                ...newRule,
                pageId,
                createdAt: new Date()
            });
            setNewRule({ type: 'hide', keyword: '', replyText: '', isEnabled: true });
            setShowCreateForm(false);
            alert('Rule created successfully!');
        } catch (error) {
            console.error('Error creating rule:', error);
            alert('Error creating rule');
        }
    };

    const handleToggleRule = async (ruleId, currentStatus) => {
        try {
            await updateDoc(doc(db, 'rules', ruleId), {
                isEnabled: !currentStatus
            });
        } catch (error) {
            console.error('Error toggling rule:', error);
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;

        try {
            await deleteDoc(doc(db, 'rules', ruleId));
            alert('Rule deleted successfully!');
        } catch (error) {
            console.error('Error deleting rule:', error);
            alert('Error deleting rule');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Moderation Rules</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    {showCreateForm ? 'Cancel' : '+ Create Rule'}
                </button>
            </div>

            {/* Create Rule Form */}
            {showCreateForm && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Rule</h3>
                    <form onSubmit={handleCreateRule} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rule Type
                            </label>
                            <select
                                value={newRule.type}
                                onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                <option value="hide">Hide Comment</option>
                                <option value="block">Block Comment</option>
                                <option value="auto-reply">Auto Reply</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keyword to Match
                            </label>
                            <input
                                type="text"
                                value={newRule.keyword}
                                onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
                                placeholder="e.g., spam, offensive word"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Comments containing this keyword will trigger the rule
                            </p>
                        </div>

                        {newRule.type === 'auto-reply' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reply Text
                                </label>
                                <textarea
                                    value={newRule.replyText}
                                    onChange={(e) => setNewRule({ ...newRule, replyText: e.target.value })}
                                    placeholder="Enter the automatic reply message"
                                    rows={3}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                        )}

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={newRule.isEnabled}
                                onChange={(e) => setNewRule({ ...newRule, isEnabled: e.target.checked })}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                                Enable rule immediately
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Create Rule
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Rules List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {rules.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        No rules created yet. Create your first rule to start automating moderation!
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {rules.map((rule) => (
                            <div key={rule.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${rule.type === 'hide' ? 'bg-red-100 text-red-800' :
                                                    rule.type === 'block' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {rule.type.toUpperCase()}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded ${rule.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {rule.isEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-gray-900">
                                                Keyword: <span className="font-normal text-gray-700">"{rule.keyword}"</span>
                                            </p>
                                            {rule.replyText && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Reply: "{rule.replyText}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => handleToggleRule(rule.id, rule.isEnabled)}
                                            className={`px-3 py-1 text-sm rounded ${rule.isEnabled
                                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    : 'bg-green-600 text-white hover:bg-green-700'
                                                }`}
                                        >
                                            {rule.isEnabled ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRule(rule.id)}
                                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RulesSection;
