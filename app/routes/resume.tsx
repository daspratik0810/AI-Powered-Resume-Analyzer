import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
export const meta = () => ([
  {title: "CVorithm | Review"},
  {name: "description", content: "AI Feedback for your resume"},
])

const Resume = () => {
  const {auth, isLoading, fs, kv } = usePuterStore()
  const {id} = useParams()
  const [imageUrl, setImageUrl] = useState("")
  const [resumeUrl, setResumeUrl] = useState("")
  const [feedback, setFeedback] = useState<Feedback | null >(null)
  const [loadingResume, setLoadingResume] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`)
  }, [isLoading, auth.isAuthenticated, navigate, id])

  useEffect(() => {
    const loadResume = async () => {
      setLoadingResume(true)
      const resume = await kv.get(`resume:${id}`)

      if(!resume) {
        setLoadingResume(false)
        return
      }

      try {
        const data = JSON.parse(resume)

        const resumeBlob = await fs.read(data.resumePath)
        if (resumeBlob) {
          const pdfBlob = new Blob([resumeBlob], {type: "application/pdf"})
          const resumeUrl = URL.createObjectURL(pdfBlob)
          setResumeUrl(resumeUrl)
        }

        if (data.imagePath) {
          const imageBlob = await fs.read(data.imagePath)
          if (imageBlob) {
            const imageUrl = URL.createObjectURL(imageBlob)
            setImageUrl(imageUrl)
          }
        }

        if (data.feedback && typeof data.feedback === "object") {
          setFeedback(data.feedback)
        }
      } catch (error) {
        console.error("Failed to load resume record:", error)
      } finally {
        setLoadingResume(false)
      }
    }
    loadResume()
  }, [id])

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <nav className="navbar">
        <Link to="/" className="back-button  bg-[url('/images/bg-main.svg')] bg-cover">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse gap-8 px-6 pb-12">
          <section className=" mt-5 resume-preview-section lg:w-[45%] w-full bg-[url('/images/bg-small.svg')] bg-cover rounded-[32px] overflow-hidden p-6 flex flex-col items-center justify-start min-h-[calc(100vh-140px)] sticky top-6">
            {resumeUrl ? (
              <>
                <div className="resume-preview-header w-full flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mt-3">Resume Preview</h3>
                    <p className="text-sm text-gray-500">Review the document and open it in a new tab.</p>
                  </div>
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
                  >
                    Open in new tab
                  </a>
                </div>
                <div className="animate-in fade-in duration-1000 w-full flex-1 min-h-[82vh]">
                  {imageUrl ? (
                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <img
                        src={imageUrl}
                        title="resume"
                        className="w-full h-full rounded-[28px] object-contain border border-gray-200 bg-white shadow-sm"
                      />
                    </a>
                  ) : (
                    <div className="w-full h-full rounded-[28px] overflow-hidden border border-gray-200 bg-white shadow-sm">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    
                      </div>
                      <iframe
                        src={resumeUrl}
                        title="resume"
                        className="w-full h-[calc(100%-52px)] border-0"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </section>
          <section className=" mt-5 feedback-section lg:w-[55%] w-full flex-1 bg-white/95 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-white/80">
            <div className="mb-6 ">
              <h2 className="text-4xl text-slate-900 font-bold">Resume Review</h2>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Your AI feedback is shown here. Scroll through the score summary and detailed suggestions for faster improvements.
              </p>
            </div>
            {loadingResume ? (
              <div className="flex flex-col items-center justify-center py-20">
                <img src="/images/resume-scan-2.gif" className="w-32 h-32" />
                <p className="mt-4 text-gray-600">Loading your review...</p>
              </div>
            ) : feedback ? (
                <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                    <Summary feedback={feedback} />
                    <ATS score={feedback.ATS.score || 0 } suggestions={feedback.ATS.tips || []} />
                    <Details feedback={feedback} />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-600">
                  <p className="text-lg font-medium">Nothing to show yet.</p>
                  <p className="mt-2">Your resume was uploaded, but feedback was not found. Try again or upload a new resume.</p>
                </div>
            )}
          </section>
      </div>
    </main>
  )
}

export default Resume