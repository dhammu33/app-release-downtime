import React from 'react';
import { Skeleton } from 'primereact/skeleton';
import './SummaryCard.scss';

interface SummaryCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    colorClass?: 'primary' | 'warning' | 'success';
    loading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, colorClass = 'primary', loading = false }) => {
    return (
        <div className={`summary-card ${colorClass}`}>
            <div className="card-icon-container">
                {icon}
            </div>
            <div className="card-info">
                <h3 className="card-title">{title}</h3>
                <div className="card-value">
                    {loading ? <Skeleton width="3rem" height="2rem" /> : value}
                </div>
            </div>
        </div>
    );
};

export default SummaryCard;
