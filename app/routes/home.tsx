import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCards from "~/components/ResumeCards";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CVorithm | Turn Your CV Into Opportunities" },
    { name: "description", content: "AI-driven resume analysis that helps you optimize your CV, improve ATS scores, and stand out to recruiters." },
  ];
}

export default function Home() {

  //it is a custom hook created in puter.js, so we can simply import and use it
  const {isLoading, auth, fs, kv} = usePuterStore();
  const navigate = useNavigate()
  const [resumeUrl,setResumeUrl] = useState("")
  const [resumes,setResumes] = useState<Resume[]>([])
  const [loadingResumes,setLoadingResumes] = useState(false)



  //useEffect is a react hook that runs after the component has been rendered and dependencies is changed.
  //when a user tries to access a secure route but they are not authenticated, then user is re-directed to auth again,that means they are blocked at auth. But if the user is authenticated then it will directed/navigated to the next page where they want to be directed
  useEffect( () =>{
    if(!isLoading && !auth.isAuthenticated) navigate('/auth?next=/')
  }, [isLoading, auth.isAuthenticated, navigate])
  
  useEffect( () =>{
    const loadResumes = async () => {
      setLoadingResumes(true)
      const resumes = ( await kv.list("resume:*", true)) as KVItem[]
      
      const parsedResumes = resumes?.map( (resume) => (
        JSON.parse(resume.value) as Resume
      ))

      console.log("parsedResumes", parsedResumes)
      setResumes(parsedResumes || [])
      setLoadingResumes(false)
    }
  
    loadResumes()
  }, [])


  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    {/*NAVIGATION BAR*/}
    <Navbar />
      

    {/*MAIN-DESCRIPTION*/}
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Your Resume Has a Story. We Reveal It.</h1>
        {!loadingResumes && resumes?.length === 0 ? (
          <h2>Upload your first resume to get started. CVorithm will analyze it and provide detailed feedback to help you improve.</h2>
        ): (
          <h2> Every resume has blind spots. Review your submissions and CVorithm finds them, explains them and helps you fix them before recruiters
          ever notice.</h2>
        )}
      </div>
    
      {loadingResumes && (
        <div className="flex flex-col items-center justify-center">
          <img src="/images/resume-scan-2.gif" className="w-16 h-16 animate-spin"/>
        </div>
      )}

      {!loadingResumes && resumes?.length === 0 && (
        <div className="flex flex-col items-center justify-centermt-10 gap-4">
          <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
            Upload Resume
          </Link>
        </div>
      )}
      

      {/*TEMPLETES*/}
      {/* "resumes" from index.ts are an array of objects that contains different resumes*/}

      {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCards key={resume.id} resume={resume} />
            ))}
          </div>
      )}
    </section>

  </main>
}
