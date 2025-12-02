import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    ArrowRightOnRectangleIcon,
    SparklesIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const navigation = [
    { name: 'Overview', id: 'overview', icon: HomeIcon },
    { name: 'Comments', id: 'comments', icon: ChatBubbleLeftRightIcon },
    { name: 'Rules', id: 'rules', icon: ShieldCheckIcon },
    { name: 'Analytics', id: 'analytics', icon: ChartBarIcon },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout({ children, user, activeTab, onTabChange }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {/* Top Navbar */}
            <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        {/* Logo & Brand */}
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <SparklesIcon className="h-6 w-6 text-white" />
                                </div>
                                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                                    ClearComment
                                </span>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:ml-8 md:flex md:space-x-2">
                                {navigation.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => onTabChange(item.id)}
                                        className={classNames(
                                            activeTab === item.id
                                                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                                                : 'text-gray-700 hover:bg-gray-100',
                                            'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200'
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 mr-2" />
                                        {item.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right side - User Menu */}
                        <div className="flex items-center">
                            {/* Desktop User Menu */}
                            <div className="hidden md:block">
                                <Menu as="div" className="relative ml-3">
                                    <div>
                                        <Menu.Button className="flex items-center gap-3 rounded-full bg-white px-3 py-2 text-sm hover:bg-gray-50 transition-colors border border-gray-200">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-md">
                                                {user?.email?.[0].toUpperCase()}
                                            </div>
                                            <span className="hidden lg:block text-sm font-semibold text-gray-900">
                                                {user?.displayName || user?.email?.split('@')[0]}
                                            </span>
                                        </Menu.Button>
                                    </div>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                                            <div className="py-1">
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {user?.displayName || 'User'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {user?.email}
                                                    </p>
                                                </div>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={handleLogout}
                                                            className={classNames(
                                                                active ? 'bg-gray-50' : '',
                                                                'flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50'
                                                            )}
                                                        >
                                                            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                                                            Log out
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            </div>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>

                            {/* Mobile menu button */}
                            <div className="flex md:hidden">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                >
                                    <span className="sr-only">Open main menu</span>
                                    {mobileMenuOpen ? (
                                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <Transition
                    show={mobileMenuOpen}
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 -translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 -translate-y-1"
                >
                    <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
                        <div className="space-y-1 px-2 pb-3 pt-2">
                            {navigation.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        onTabChange(item.id);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={classNames(
                                        activeTab === item.id
                                            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                                            : 'text-gray-700 hover:bg-gray-100',
                                        'flex items-center w-full px-3 py-2 rounded-lg text-base font-medium transition-colors'
                                    )}
                                >
                                    <item.icon className="h-5 w-5 mr-3" />
                                    {item.name}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-gray-200 pb-3 pt-4">
                            <div className="flex items-center px-4 mb-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-md">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-900">
                                        {user?.displayName || user?.email?.split('@')[0]}
                                    </div>
                                    <div className="text-sm text-gray-500">{user?.email}</div>
                                </div>
                            </div>
                            <div className="px-2">
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                                    Log out
                                </button>
                            </div>
                        </div>
                    </div>
                </Transition>
            </nav>

            {/* Main Content */}
            <main className="py-6 sm:py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
