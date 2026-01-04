
import React from 'react';
import {
    ShieldCheck, Coffee, Flag, Gamepad2, Gem,
    BookOpen, Banknote, Key, Briefcase, Store,
    MoreHorizontal, TrendingUp, Globe, Building2,
    Building, Coins, Landmark, Globe2, Wallet, Receipt, PieChart
} from 'lucide-react';
import { ExpenseCategory, IncomeCategory } from '../../types';

// --- Badge Component ---

interface BadgeProps {
    label: string;
    variant?: 'category' | 'investment';
    className?: string; // Additional classes for external styling
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'category', className = '' }) => {
    const getStyles = () => {
        if (variant === 'category') {
            switch (label) {
                case ExpenseCategory.CUSTO_FIXO:
                    return { color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400', icon: <ShieldCheck size={14} /> };
                case ExpenseCategory.CONFORTO:
                    return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', icon: <Coffee size={14} /> };
                case ExpenseCategory.METAS:
                    return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: <Flag size={14} /> };
                case ExpenseCategory.PRAZERES:
                    return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400', icon: <Gamepad2 size={14} /> };
                case ExpenseCategory.LIBERDADE_FINANCEIRA:
                    return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: <Gem size={14} /> };
                case ExpenseCategory.CONHECIMENTO:
                    return { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400', icon: <BookOpen size={14} /> };
                case IncomeCategory.SALARIOS:
                    return { color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400', icon: <Banknote size={14} /> };
                case IncomeCategory.ALUGUEL:
                    return { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: <Key size={14} /> };
                case IncomeCategory.CONSULTORIA:
                    return { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400', icon: <Briefcase size={14} /> };
                case IncomeCategory.NEGOCIOS:
                    return { color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400', icon: <Store size={14} /> };
                case 'Dividendos':
                    return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: <Wallet size={14} /> };
                case 'JSCP':
                    return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: <Receipt size={14} /> };
                case 'Rendimento':
                    return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', icon: <PieChart size={14} /> };
                default:
                    return { color: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400', icon: <MoreHorizontal size={14} /> };
            }
        } else {
            // Investment variant
            switch (label) {
                case 'Ações (BR)':
                    return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', icon: <TrendingUp size={14} /> };
                case 'Stocks':
                    return { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400', icon: <Globe size={14} /> };
                case 'FIIs':
                    return { color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400', icon: <Building2 size={14} /> };
                case 'REITs':
                    return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: <Building size={14} /> };
                case 'Cripto':
                    return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400', icon: <Coins size={14} /> };
                case 'Renda Fixa (BR)':
                    return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: <Landmark size={14} /> };
                case 'Renda Fixa Inter.':
                    return { color: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400', icon: <Globe2 size={14} /> };
                default:
                    return { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: <Gem size={14} /> };
            }
        }
    };

    const { color, icon } = getStyles();
    const baseClasses = variant === 'category'
        ? "px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit transition-all"
        : "px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit uppercase tracking-wider transition-all shadow-sm";

    return (
        <span className={`${baseClasses} ${color} ${className}`}>
            {icon}
            {label}
        </span>
    );
};

// --- PageHeader Component ---

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, extra }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
                {description && <p className="text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                {extra}
                {action}
            </div>
        </div>
    );
};

// --- Card Component ---

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'small' | 'medium' | 'large';
    title?: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'medium',
    title,
    subtitle,
    headerAction
}) => {
    const paddingMap = {
        none: 'p-0',
        small: 'p-4',
        medium: 'p-6',
        large: 'p-8'
    };

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors overflow-hidden ${className}`}>
            {(title || subtitle || headerAction) && (
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/10">
                    <div>
                        {title && <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
                        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
                    </div>
                    {headerAction}
                </div>
            )}
            <div className={paddingMap[padding]}>
                {children}
            </div>
        </div>
    );
};

// --- SummaryCard Component (Specific variant of Card often used for stats) ---

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    iconBgColor: string;
    iconColor: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, iconBgColor, iconColor }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
            <div className={`p-3 ${iconBgColor} ${iconColor} rounded-xl`}>
                {React.cloneElement(icon as React.ReactElement, { size: 32 })}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
            </div>
        </div>
    );
};
