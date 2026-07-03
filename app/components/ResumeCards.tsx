import React, { useEffect, useState } from 'react'
import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { usePuterStore } from '~/lib/puter';

const ResumeCards = ({ resume: { id, companyName, jobTitle, feedback, imagePath, resumePath } }: { resume: Resume }) => {
    const { fs } = usePuterStore();
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isPdfPreview, setIsPdfPreview] = useState(false);

    useEffect(() => {
        let active = true;
        let url: string | null = null;

        const loadPreview = async () => {
            if (imagePath) {
                try {
                    const blob = await fs.read(imagePath);
                    if (active && blob) {
                        url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                        setIsPdfPreview(false);
                        return;
                    }
                } catch (error) {
                    console.warn("Failed to load resume image preview:", error);
                }
            }

            if (resumePath) {
                try {
                    const blob = await fs.read(resumePath);
                    if (active && blob) {
                        url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                        setIsPdfPreview(true);
                        return;
                    }
                } catch (error) {
                    console.warn("Failed to load resume PDF preview:", error);
                }
            }

            setPreviewUrl("");
            setIsPdfPreview(false);
        };

        loadPreview();

        return () => {
            active = false;
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [fs, imagePath, resumePath]);

    const score = typeof feedback === "object" && feedback ? feedback.overallScore : 0;

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000" >
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                    {jobTitle && <h3 className="text-gray-600 text-lg break-words">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="text-gray-600 text-lg break-words">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={score} />
                </div>
            </div>
            {previewUrl ? (
                <div className="gradient-border animate-in fade-in duration-1000">
                    <div className="w-full h-full">
                        {isPdfPreview ? (
                            <iframe
                                src={previewUrl}
                                title="resume preview"
                                className="w-full h-[420px] max-sm:h-[280px] border-0"
                            />
                        ) : (
                            <img
                                src={previewUrl}
                                alt="resume"
                                className="w-full h-[420px] max-sm:h-[280px] object-contain"
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div className="gradient-border animate-in fade-in duration-1000 bg-white p-6 rounded-[28px] border border-gray-200 min-h-[280px] flex items-center justify-center text-gray-500">
                    Resume preview unavailable
                </div>
            )}
        </Link>
    )
}

export default ResumeCards