import React, { useState } from 'react'
import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import resume from '~/routes/resume';
import {useEffect} from "react";
import { usePuterStore } from '~/lib/puter';


const ResumeCards = ({resume:{id,companyName,jobTitle, feedback, imagePath}}:{resume : Resume}) => {
    //now because we used element destructuring and "Resume" from index.d.ts. It knows that there is a const resume, which has an id with datatypes string
    //the section below has many reusuable resume cards which also navigates using react router to the specific resume.id
    const {fs} = usePuterStore()
    const [resumeUrl,setResumeUrl] = useState("")
    
    useEffect( () => {
    const loadResume = async () => {
       const blob = await fs.read(imagePath)
       if(!blob) return
       let url = URL.createObjectURL(blob)
       setResumeUrl(url)
    }
    loadResume()
  }, [imagePath])
    
    
    
    return (
    <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000" >

        {/*RESUME-CARD-HEADER*/}
        <div className="resume-card-header">
            <div className="flex flex-col gap-2">
                {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
               {jobTitle && <h3 className="text-gray-600 text-lg break-words">{jobTitle}</h3>} 
               {!companyName && !jobTitle && <h2 className="text-gray-600 text-lg break-words">Resume</h2>}
            </div>

            {/*below section we can do it with SVG file, but as we need info inside so we are making with react components*/}
            <div className="flex-shrink-0">
                <ScoreCircle score={feedback.overallScore} />
            </div>
        </div>

        {/*RESUME-CARD-IMAGE*/}
        {resumeUrl && (
        <div className="gradient-border animate-in fade-in duration-1000">
            <div className="w-full h-full">
                <img src={resumeUrl}
                alt="resume"
                 className="w-full h-[420px] max-sm:h-[280px] object-contain"
                />
            </div>
        </div>
      )}
    </Link>
  )
}

export default ResumeCards