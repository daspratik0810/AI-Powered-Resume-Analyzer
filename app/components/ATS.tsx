import React from 'react'

interface Suggestion {
  type: "good" | "improve";
  tip: string;
}

interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  let bgColor = "from-red-100";
  let scoreIcon = "/icons/ats-bad.svg";

  if (score > 69) {
    bgColor = "from-green-100";
    scoreIcon = "/icons/ats-good.svg";
  } else if (score > 49) {
    bgColor = "from-yellow-100";
    scoreIcon = "/icons/ats-warning.svg";
  }

  return (
    <div className={`w-full rounded-2xl p-6 bg-gradient-to-b ${bgColor} to-white shadow-md flex flex-col gap-6`}>
      {/* Top Section */}
      <div className="flex flex-row items-center gap-4">
        <img src={scoreIcon} alt="ATS Score Icon" className="w-12 h-12" />
        <h2 className="text-3xl font-bold text-gray-900">ATS Score {score}/100</h2>
      </div>

      {/* Description Section */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">What is an ATS Score?</h3>
          <p className="text-gray-500 text-sm mt-1">
            An ATS (Applicant Tracking System) score helps you understand how well your resume might be parsed by automated systems used by recruiters.
          </p>
        </div>

        {/* Suggestions List */}
        <div className="flex flex-col gap-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex flex-row items-start gap-3">
              <img 
                src={suggestion.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'} 
                alt={suggestion.type} 
                className="w-5 h-5 mt-0.5"
              />
              <p className="text-gray-700 text-sm">{suggestion.tip}</p>
            </div>
          ))}
        </div>

        {/* Closing Line */}
        <p className="text-sm font-medium text-gray-600 italic border-t border-gray-100 pt-3">
          Keep optimizing to increase your chances of getting noticed!
        </p>
      </div>
    </div>
  )
}

export default ATS