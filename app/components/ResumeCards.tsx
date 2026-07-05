import React, { useEffect, useState } from 'react'
import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { usePuterStore } from '~/lib/puter';

const ResumeCards = ({ resume: { id, companyName, jobTitle, feedback, imagePath, resumePath, previewImage } }: { resume: Resume }) => {
    const { fs, kv } = usePuterStore();
    // Debug: log resume record arriving to the card
    console.debug('ResumeCards props:', { id, companyName, jobTitle, imagePath, resumePath, hasPreviewImage: !!previewImage })
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isPdfPreview, setIsPdfPreview] = useState(false);
    const [previewSource, setPreviewSource] = useState<string>("");
    const [uploading, setUploading] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement | null>(null)
    const [showWipeConfirm, setShowWipeConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const fileToDataUrl = async (file: File): Promise<string> => {
        return await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                if (typeof reader.result === 'string') resolve(reader.result)
                else reject(new Error('Failed to read file'))
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
        })
    }

    const handleRepairClick = () => {
        fileInputRef.current?.click()
    }

    const handleWipeClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setShowWipeConfirm((s) => !s)
    }

    const handleConfirmWipe = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (!confirm('This will permanently delete this resume and its data. Continue?')) return
        setDeleting(true)
            try {
            const looksLikeLocalPath = (p?: string) => {
                if (!p) return false
                if (p.includes('\\') || /^[a-zA-Z]:/.test(p)) return true
                if (p.toLowerCase().includes('appdata') || p.toLowerCase().includes('users')) return true
                return false
            }

            // attempt to delete stored files if they are not local paths
            if (imagePath && !looksLikeLocalPath(imagePath)) {
                try { await fs.delete(imagePath) } catch (err) { console.warn('Failed to delete imagePath', err) }
            }
            if (resumePath && !looksLikeLocalPath(resumePath)) {
                try { await fs.delete(resumePath) } catch (err) { console.warn('Failed to delete resumePath', err) }
            }

            // delete kv entry. Some Puter runtimes don't implement kv.delete; fall back to kv.set(key, '')
            try {
                // attempt delete; may throw if underlying puter.kv.delete is undefined
                await kv.delete(`resume:${id}`)
            } catch (kvErr) {
                console.warn('kv.delete failed, falling back to kv.set empty string', kvErr)
                try {
                    await kv.set(`resume:${id}`, "")
                } catch (setErr) {
                    console.error('kv.set fallback failed:', setErr)
                }
            }
            // refresh page to update list
            window.location.reload()
        } catch (err) {
            console.error('Wipe failed:', err)
            alert('Wipe failed. See console for details.')
        } finally {
            setDeleting(false)
            setShowWipeConfirm(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const uploaded = await fs.upload([file])
            if (!uploaded || !uploaded.path) throw new Error('Upload failed')
            const preview = await fileToDataUrl(file)
            const data = {
                id,
                resumePath: uploaded.path,
                imagePath: '',
                previewImage: preview,
                companyName, jobTitle,
                jobDescription: ('' as string),
                feedback: feedback || null
            }
            await kv.set(`resume:${id}`, JSON.stringify(data))
            setPreviewUrl(preview)
            setPreviewSource('previewImage')
        } catch (err) {
            console.error('Repair upload failed:', err)
            alert('Repair failed. See console for details.')
        } finally {
            setUploading(false)
            // clear input
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    useEffect(() => {
        let active = true;
        let url: string | null = null;

        const looksLikeLocalPath = (p?: string) => {
            if (!p) return false
            // Windows absolute paths contain backslashes or a drive letter like C:
            if (p.includes('\\') || /^[a-zA-Z]:/.test(p)) return true
            if (p.startsWith('file://')) return true
            return false
        }

        const loadPreview = async () => {
            if (previewImage) {
                // If previewImage is a PDF data URL, render it in an iframe
                const isPdfDataUrl = typeof previewImage === 'string' && previewImage.startsWith('data:application/pdf')
                if (isPdfDataUrl) {
                    setPreviewUrl(previewImage)
                    setIsPdfPreview(true)
                    setPreviewSource('previewPdfDataUrl')
                    console.debug(`ResumeCards(${id}): using PDF data-url previewImage`)
                    return
                }

                setPreviewUrl(previewImage);
                setIsPdfPreview(false);
                setPreviewSource('previewImage')
                console.debug(`ResumeCards(${id}): using previewImage`)
                return;
            }

            if (imagePath && !looksLikeLocalPath(imagePath)) {
                try {
                    const blob = await fs.read(imagePath);
                    if (active && blob) {
                        url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                        setIsPdfPreview(false);
                        setPreviewSource('imageBlob')
                        console.debug(`ResumeCards(${id}): loaded image blob from fs.read(${imagePath})`)
                        return;
                    }
                } catch (error) {
                    console.warn("Failed to load resume image preview:", error);
                }
            } else if (imagePath) {
                console.debug(`ResumeCards(${id}): skipping imagePath because it looks like a local path: ${imagePath}`)
            }

            if (resumePath && !looksLikeLocalPath(resumePath)) {
                try {
                    const blob = await fs.read(resumePath);
                    if (active && blob) {
                        url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                        setIsPdfPreview(true);
                        setPreviewSource('pdfBlob')
                        console.debug(`ResumeCards(${id}): loaded pdf blob from fs.read(${resumePath})`)
                        return;
                    }
                } catch (error) {
                    console.warn("Failed to load resume PDF preview:", error);
                }
            } else if (resumePath) {
                console.debug(`ResumeCards(${id}): skipping resumePath because it looks like a local path: ${resumePath}`)
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
    }, [fs, imagePath, previewImage, resumePath, id]);

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
                        {previewSource && (
                            <div className="absolute top-3 right-3 bg-white/90 text-xs px-2 py-1 rounded shadow">{previewSource}</div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="gradient-border animate-in fade-in duration-1000 bg-white p-6 rounded-[28px] border border-gray-200 min-h-[280px] flex flex-col items-center justify-center text-gray-500 relative">
                    <div>Resume preview unavailable</div>
                    <div className="mt-3 text-xs text-gray-400">Debug:</div>
                    <ul className="mt-2 text-xs text-gray-500">
                        <li>previewImage: {previewImage ? 'yes' : 'no'}</li>
                        <li>imagePath: {imagePath ? imagePath : 'none'}</li>
                        <li>resumePath: {resumePath ? resumePath : 'none'}</li>
                    </ul>
                    <div className="mt-3 flex flex-col items-center">
                        <input ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" type="file" className="hidden" />
                        <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRepairClick() }} disabled={uploading} className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded bg-indigo-600 text-white text-sm">
                                {uploading ? 'Repairing...' : 'Repair preview'}
                            </button>
                            <button onClick={handleWipeClick} className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded bg-red-600 text-white text-sm">
                                Wipe
                            </button>
                        </div>
                        {showWipeConfirm && (
                            <div className="mt-3 w-full p-3 bg-red-50 border border-red-200 rounded text-center">
                                <div className="text-sm text-red-700">Are you sure? This will permanently delete this resume.</div>
                                <div className="mt-2 flex justify-center gap-2">
                                    <button onClick={handleConfirmWipe} disabled={deleting} className="px-3 py-2 rounded bg-red-600 text-white text-sm">
                                        {deleting ? 'Deleting...' : 'Confirm wipe'}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowWipeConfirm(false) }} className="px-3 py-2 rounded bg-gray-200 text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Link>
    )
}

export default ResumeCards