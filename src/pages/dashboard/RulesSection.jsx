import { useState, useEffect, Fragment } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Dialog, Transition, Switch } from '@headlessui/react';
import {
    PlusIcon,
    TrashIcon,
    NoSymbolIcon,
    EyeSlashIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const RulesSection = ({ pageId }) => {
    const [rules, setRules] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        triggerType: 'keyword',
        keywords: '', // Will be split into array on save
        action: 'hide',
        replyText: '',
        enabled: true,
        applyImmediately: false
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
            // Split keywords string into array
            const keywordsArray = newRule.keywords.split(',').map(k => k.trim()).filter(k => k);

            await addDoc(collection(db, 'rules'), {
                pageId,
                name: newRule.name,
                triggerType: newRule.triggerType,
                keywords: keywordsArray,
                action: newRule.action,
                replyText: newRule.replyText,
                enabled: newRule.enabled,
                createdAt: new Date(),
                // createdBy: user.uid // Need to pass user prop to RulesSection
            });

            console.log('Rule created successfully!');

            // Apply rule to existing comments if requested
            if (newRule.applyImmediately && newRule.enabled) {
                console.log('Applying rule to existing comments...');
                try {
                    const response = await fetch(`${import.meta.env.VITE_RAILWAY_URL}/api/apply-rules`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ pageId })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        alert(`Rule created! Processed ${result.processedCount || 0} comments, ${result.hiddenCount || 0} were hidden.`);
                    } else {
                        alert('Rule created, but failed to apply to existing comments. Click "Apply Rules" button to try again.');
                    }
                } catch (error) {
                    console.error('Error applying rules:', error);
                    alert('Rule created, but failed to apply to existing comments. Click "Apply Rules" button to try again.');
                }
            } else {
                alert('Rule created successfully!');
            }

            setNewRule({ name: '', triggerType: 'keyword', keywords: '', action: 'hide', replyText: '', enabled: true, applyImmediately: false });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating rule:', error);
            alert('Error creating rule');
        }
    };

    const handleToggleRule = async (ruleId, currentStatus) => {
        try {
            await updateDoc(doc(db, 'rules', ruleId), {
                enabled: !currentStatus
            });
        } catch (error) {
            console.error('Error toggling rule:', error);
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;

        try {
            await deleteDoc(doc(db, 'rules', ruleId));
        } catch (error) {
            console.error('Error deleting rule:', error);
            alert('Error deleting rule');
        }
    };

    const getRuleIcon = (type) => {
        switch (type) {
            case 'hide': return <EyeSlashIcon className="h-5 w-5 text-red-500" />;
            case 'block': return <NoSymbolIcon className="h-5 w-5 text-orange-500" />;
            case 'auto-reply': return <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />;
            default: return <EyeSlashIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center px-4 pt-4">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">Moderation Rules</h2>
                    <p className="text-sm text-gray-500">Automate your comment moderation</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Create Rule
                </button>
            </div>

            {/* Rules List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {rules.length === 0 ? (
                    <div className="text-center py-12">
                        <NoSymbolIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No rules yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new moderation rule.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                New Rule
                            </button>
                        </div>
                    </div>
                ) : (
                    <ul role="list" className="divide-y divide-gray-200">
                        {rules.map((rule) => (
                            <li key={rule.id}>
                                <div className="px-4 py-4 flex items-center sm:px-6">
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 bg-gray-100 rounded-lg p-2">
                                                {getRuleIcon(rule.action)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="flex items-center">
                                                    <p className="font-medium text-indigo-600 truncate">{rule.name || 'Unnamed Rule'}</p>
                                                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.action === 'hide' ? 'bg-red-100 text-red-800' :
                                                        rule.action === 'block' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {rule.action?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex text-sm text-gray-500 flex-col">
                                                    <span className="text-xs text-gray-400 mb-1">Keywords: {Array.isArray(rule.keywords) ? rule.keywords.join(', ') : rule.keywords}</span>
                                                    {rule.action === 'auto-reply' && (
                                                        <span className="truncate max-w-xs">Reply: "{rule.replyText}"</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0 flex items-center gap-4">
                                        <Switch
                                            checked={rule.enabled}
                                            onChange={() => handleToggleRule(rule.id, rule.enabled)}
                                            className={`${rule.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                                        >
                                            <span className="sr-only">Use setting</span>
                                            <span
                                                aria-hidden="true"
                                                className={`${rule.enabled ? 'translate-x-5' : 'translate-x-0'
                                                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                            />
                                        </Switch>
                                        <button
                                            onClick={() => handleDeleteRule(rule.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Create Rule Modal */}
            <Transition.Root show={showCreateForm} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setShowCreateForm}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                    <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            onClick={() => setShowCreateForm(false)}
                                        >
                                            <span className="sr-only">Close</span>
                                            <NoSymbolIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <PlusIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                                Create New Rule
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <form onSubmit={handleCreateRule} className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Rule Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newRule.name}
                                                            onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                                            placeholder="e.g., Block Spam Links"
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Action
                                                        </label>
                                                        <select
                                                            value={newRule.action}
                                                            onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                            required
                                                        >
                                                            <option value="hide">Hide Comment</option>
                                                            <option value="block">Block Comment</option>
                                                            <option value="auto-reply">Auto Reply</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Keywords (comma separated)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newRule.keywords}
                                                            onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                                                            placeholder="e.g., spam, scam, fake"
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                            required
                                                        />
                                                    </div>

                                                    {newRule.action === 'auto-reply' && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Reply Text
                                                            </label>
                                                            <textarea
                                                                value={newRule.replyText}
                                                                onChange={(e) => setNewRule({ ...newRule, replyText: e.target.value })}
                                                                placeholder="Enter the automatic reply message"
                                                                rows={3}
                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                                required
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={newRule.enabled}
                                                            onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <label className="ml-2 text-sm text-gray-700">
                                                            Enable rule immediately
                                                        </label>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={newRule.applyImmediately}
                                                            onChange={(e) => setNewRule({ ...newRule, applyImmediately: e.target.checked })}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <label className="ml-2 text-sm text-gray-700">
                                                            Apply to existing comments immediately
                                                        </label>
                                                    </div>

                                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                        <button
                                                            type="submit"
                                                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                                        >
                                                            Create Rule
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                                            onClick={() => setShowCreateForm(false)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
};

export default RulesSection;
