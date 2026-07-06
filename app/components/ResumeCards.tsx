import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath }, onDelete }: { resume: Resume; onDelete: (id: string) => Promise<void> }) => {
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadResume = async () => {
            const blob = await fs.read(imagePath);
            if(!blob) return;
            let url = URL.createObjectURL(blob);
            setResumeUrl(url);
        }

        loadResume();
    }, [imagePath]);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (window.confirm(`Delete "${companyName || jobTitle || 'Resume'}"?`)) {
            setIsDeleting(true);
            try {
                await onDelete(id);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <Link 
            to={`/resume/${id}`} 
            className={`resume-card animate-in fade-in duration-1000 relative group transition-all duration-500 ${
                isDeleting ? 'opacity-0 scale-95' : ''
            }`}
            onClick={(e) => isDeleting && e.preventDefault()}
        >
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                    {jobTitle && <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="!text-black font-bold">Resume</h2>}
                </div>

                <div className="flex-shrink-0">
                    <ScoreCircle score={feedback?.overallScore ?? 0} />
                </div>

            </div>
            {resumeUrl && (
                <div className="gradient-border animate-in fade-in duration-1000">
                    <div className="w-full h-full">
                        <img
                            src={resumeUrl}
                            alt="resume"
                            className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
                        />
                    </div>
                </div>
                )}
            
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white p-2 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                title="Delete this resume"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </Link>
    )
}
export default ResumeCard