import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

interface BackButtonProps {
    className?: string;
    onClick?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ className, onClick }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={clsx(
                "p-2 hover:bg-slate-100 rounded-full transition-colors",
                className
            )}
            aria-label="Go back"
        >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
    );
};
