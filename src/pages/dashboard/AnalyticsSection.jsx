import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const AnalyticsSection = ({ pageId }) => {
    const [stats, setStats] = useState({
        totalComments: 0,
        visibleComments: 0,
        hiddenComments: 0,
        totalRules: 0,
        activeRules: 0,
        ruleHits: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pageId) return;
        fetchAnalytics();
    }, [pageId]);

    const fetchAnalytics = async () => {
        try {
            // Fetch comments
            const commentsQuery = query(
                collection(db, 'comments'),
                where('pageId', '==', pageId)
            );
            const commentsSnapshot = await getDocs(commentsQuery);
            const comments = commentsSnapshot.docs.map(doc => doc.data());

            // Fetch rules
            const rulesQuery = query(
                collection(db, 'rules'),
                where('pageId', '==', pageId)
            );
            const rulesSnapshot = await getDocs(rulesQuery);
            const rules = rulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch logs
            const logsQuery = query(
                collection(db, 'logs'),
                where('pageId', '==', pageId)
            );
            const logsSnapshot = await getDocs(logsQuery);
            const logs = logsSnapshot.docs.map(doc => doc.data());

            // Calculate stats
            const visibleCount = comments.filter(c => c.status === 'visible').length;
            const hiddenCount = comments.filter(c => c.status === 'hidden').length;
            const activeRulesCount = rules.filter(r => r.isEnabled).length;

            // Count rule hits
            const ruleHits = rules.map(rule => ({
                name: rule.keyword,
                hits: logs.filter(log => log.ruleId === rule.id).length
            }));

            setStats({
                totalComments: comments.length,
                visibleComments: visibleCount,
                hiddenComments: hiddenCount,
                totalRules: rules.length,
                activeRules: activeRulesCount,
                ruleHits
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading analytics...</div>;
    }

    const statusChartData = {
        labels: ['Visible', 'Hidden'],
        datasets: [{
            data: [stats.visibleComments, stats.hiddenComments],
            backgroundColor: ['#10B981', '#EF4444'],
            borderWidth: 0
        }]
    };

    const ruleHitsChartData = {
        labels: stats.ruleHits.map(r => r.name),
        datasets: [{
            label: 'Rule Hits',
            data: stats.ruleHits.map(r => r.hits),
            backgroundColor: '#6366F1',
        }]
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500">Total Comments</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalComments}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500">Visible</div>
                    <div className="mt-2 text-3xl font-bold text-green-600">{stats.visibleComments}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500">Hidden</div>
                    <div className="mt-2 text-3xl font-bold text-red-600">{stats.hiddenComments}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500">Active Rules</div>
                    <div className="mt-2 text-3xl font-bold text-indigo-600">{stats.activeRules}/{stats.totalRules}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Comment Status Distribution</h3>
                    <div className="h-64 flex items-center justify-center">
                        {stats.totalComments > 0 ? (
                            <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
                        ) : (
                            <p className="text-gray-500">No data available</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Rule Performance</h3>
                    <div className="h-64">
                        {stats.ruleHits.length > 0 ? (
                            <Bar
                                data={ruleHitsChartData}
                                options={{
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: { stepSize: 1 }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-gray-500">No rules created yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border-l-4 border-indigo-500 pl-4">
                        <div className="text-sm text-gray-500">Moderation Rate</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalComments > 0
                                ? Math.round((stats.hiddenComments / stats.totalComments) * 100)
                                : 0}%
                        </div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                        <div className="text-sm text-gray-500">Approval Rate</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalComments > 0
                                ? Math.round((stats.visibleComments / stats.totalComments) * 100)
                                : 0}%
                        </div>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                        <div className="text-sm text-gray-500">Avg. Rule Hits</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalRules > 0
                                ? Math.round(stats.ruleHits.reduce((sum, r) => sum + r.hits, 0) / stats.totalRules)
                                : 0}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsSection;
