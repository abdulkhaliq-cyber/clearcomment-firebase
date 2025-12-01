import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    ArrowRightOnRectangleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: HomeIcon, color: 'from-primary-500 to-primary-600' },
    { name: 'Comments', href: '/dashboard/comments', icon: ChatBubbleLeftRightIcon, color: 'from-accent-500 to-accent-600' },
    { name: 'Rules', href: '/dashboard/rules', icon: ShieldCheckIcon, color: 'from-warning-500 to-warning-600' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon, color: 'from-success-500 to-success-600' },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout({ children, user, activeTab, onTabChange }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
                <Transition.Root show={sidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-in-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in-out duration-300"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                            <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                                                <span className="sr-only">Close sidebar</span>
                                                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </Transition.Child>
                                    {/* Sidebar component for mobile */}
                                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-primary-600 to-primary-800 px-6 pb-4">
                                        <div className="flex h-16 shrink-0 items-center">
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                                <SparklesIcon className="h-6 w-6 text-primary-600" />
                                            </div>
                                            <span className="ml-3 text-xl font-bold text-white">ClearComment</span>
                                        </div>
                                        <nav className="flex flex-1 flex-col">
                                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                                <li>
                                                    <ul role="list" className="-mx-2 space-y-2">
                                                        {navigation.map((item) => (
                                                            <li key={item.name}>
                                                                <button
                                                                    onClick={() => {
                                                                        onTabChange(item.name.toLowerCase());
                                                                        setSidebarOpen(false);
                                                                    }}
                                                                    className={classNames(
                                                                        activeTab === item.name.toLowerCase()
                                                                            ? 'bg-white/20 text-white shadow-lg'
                                                                            : 'text-primary-100 hover:text-white hover:bg-white/10',
                                                                        'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold w-full transition-all duration-200'
                                                                    )}
                                                                >
                                                                    <item.icon
                                                                        className="h-6 w-6 shrink-0"
                                                                        aria-hidden="true"
                                                                    />
                                                                    {item.name}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* Static sidebar for desktop */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-primary-600 via-primary-700 to-primary-800 px-6 pb-4 shadow-2xl">
                        <div className="flex h-20 shrink-0 items-center">
                            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-200">
                                <SparklesIcon className="h-7 w-7 text-primary-600" />
                            </div>
                            <span className="ml-3 text-2xl font-bold text-white">ClearComment</span>
                        </div>
                        <nav className="flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                <li>
                                    <ul role="list" className="-mx-2 space-y-2">
                                        {navigation.map((item) => (
                                            <li key={item.name}>
                                                <button
                                                    onClick={() => onTabChange(item.name.toLowerCase())}
                                                    className={classNames(
                                                        activeTab === item.name.toLowerCase()
                                                            ? 'bg-white text-primary-700 shadow-xl scale-105'
                                                            : 'text-primary-100 hover:text-white hover:bg-white/10',
                                                        'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold w-full transition-all duration-200 transform hover:scale-102'
                                                    )}
                                                >
                                                    <item.icon
                                                        className={classNames(
                                                            activeTab === item.name.toLowerCase() ? 'text-primary-600' : '',
                                                            'h-6 w-6 shrink-0'
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                                <li className="mt-auto">
                                    <button
                                        onClick={handleLogout}
                                        className="group -mx-2 flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 text-primary-100 hover:bg-white/10 hover:text-white w-full transition-all duration-200"
                                    >
                                        <ArrowRightOnRectangleIcon
                                            className="h-6 w-6 shrink-0"
                                            aria-hidden="true"
                                        />
                                        Log out
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <div className="lg:pl-72">
                    <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-white/20 bg-white/80 backdrop-blur-xl px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8">
                        <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
                            <span className="sr-only">Open sidebar</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <div className="flex flex-1 items-center">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent capitalize">
                                    {activeTab}
                                </h1>
                            </div>
                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                <div className="flex items-center gap-x-4 lg:gap-x-6">
                                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-300" aria-hidden="true" />
                                    <div className="flex items-center gap-3">
                                        <span className="sr-only">Your profile</span>
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white">
                                            {user?.email?.[0].toUpperCase()}
                                        </div>
                                        <span className="hidden lg:flex lg:flex-col">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {user?.displayName || user?.email?.split('@')[0]}
                                            </span>
                                            <span className="text-xs text-gray-500">{user?.email}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <main className="py-10">
                        <div className="px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
