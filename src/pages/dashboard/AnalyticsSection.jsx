import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
    ChatBubbleBottomCenterTextIcon,
    EyeIcon,
    EyeSlashIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

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
                collection(db, 'actionLogs'),
                where('pageId', '==', pageId)
            );
            const logsSnapshot = await getDocs(logsQuery);
            const logs = logsSnapshot.docs.map(doc => doc.data());

            // Calculate stats
            const visibleCount = comments.filter(c => c.status === 'visible').length;
            const hiddenCount = comments.filter(c => c.status === 'hidden').length;
            const activeRulesCount = rules.filter(r => r.enabled).length;

            // Count rule hits
            const ruleHits = rules.map(rule => ({
                name: rule.name || rule.keywords?.[0] || 'Unnamed Rule',
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
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
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
            borderRadius: 4,
        }]
    };

    const statsCards = [
        { name: 'Total Comments', value: stats.totalComments, icon: ChatBubbleBottomCenterTextIcon, color: 'text-gray-900', bg: 'bg-gray-100' },
        { name: 'Visible', value: stats.visibleComments, icon: EyeIcon, color: 'text-green-600', bg: 'bg-green-100' },
        { name: 'Hidden', value: stats.hiddenComments, icon: EyeSlashIcon, color: 'text-red-600', bg: 'bg-red-100' },
        { name: 'Active Rules', value: `${stats.activeRules}/${stats.totalRules}`, icon: ShieldCheckIcon, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((item) => (
                    <div key={item.name} className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6">
                        <dt>
                            <div className={`absolute rounded-md p-3 ${item.bg}`}>
                                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-1 sm:pb-7">
                            <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                        </dd>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Comment Status Distribution</h3>
                    <div className="h-64 flex items-center justify-center">
                        {stats.totalComments > 0 ? (
                            <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
                        ) : (
                            <div className="text-center text-gray-500">
                                <p>No comments data available</p>
                            </div>
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
                                            ticks: { stepSize: 1 },
                                            grid: { display: false }
                                        },
                                        x: {
                                            grid: { display: false }
                                        }
                                    },
                                    plugins: {
                                        legend: { display: false }
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
                    <div className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50 rounded-r-lg">
                        <div className="text-sm text-gray-500">Moderation Rate</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalComments > 0
                                ? Math.round((stats.hiddenComments / stats.totalComments) * 100)
                                : 0}%
                        </div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r-lg">
                        <div className="text-sm text-gray-500">Approval Rate</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalComments > 0
                                ? Math.round((stats.visibleComments / stats.totalComments) * 100)
                                : 0}%
                        </div>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r-lg">
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
