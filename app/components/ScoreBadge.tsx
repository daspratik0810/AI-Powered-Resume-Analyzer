import React from 'react'

interface ScoreBadgeProps {
    score: number;
}

const ScoreBadge = ({score}: {score: number}) => {
    let badgeClass = "";
    let textClass = "";
    let label = "";

    if (score > 70) {
        badgeClass = "bg-badge-green";
        textClass = "text-green-600";
        label = "Strong";
    } else if (score > 49) {
        badgeClass = "bg-badge-yellow";
        textClass = "text-yellow-600";
        label = "Good Start";
    } else {
        badgeClass = "bg-badge-red";
        textClass = "text-red-600";
        label = "Needs Work";
    }

    return (
        <div className={`score-badge ${badgeClass}`}>
            <p className={`text-xs font-medium ${textClass}`}>{label}</p>
        </div>
    )
}

export default ScoreBadge
