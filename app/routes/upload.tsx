import React from 'react'
import Navbar from "~/components/Navbar";
import {type FormEvent, useState} from "react";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "~/constants";

const Upload = () => {
    const {auth, isLoading, fs, ai, kv} = usePuterStore()
    const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const handleFileSelect = (file: File | null) => {
    setFile(file)
  }

  const handleAnalyze = async ({companyName, jobTitle, jobDescription, file} : {companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
     setIsProcessing(true)
      setProcessingStatus("Uploading resume...")
      const uploadedFile = await fs.upload([file])

      if(!uploadedFile) return setProcessingStatus("Error uploading file")

      setProcessingStatus("Analyzing resume and converting to image...")
      const imageFile = await convertPdfToImage(file)
      if(!imageFile.file) return setProcessingStatus("Error converting Resume pdf to image")

      setProcessingStatus("Analyzing resume...")

      const uploadedImage = await fs.upload([imageFile.file])
      if(!uploadedImage) return setProcessingStatus("Error uploading image")

      setProcessingStatus("Generating feedback...")

      const uuid = generateUUID()
      const data = {
          id : uuid,
          resumePath : uploadedFile.path,
          imagePath : uploadedImage.path,
          companyName, jobTitle, jobDescription,
          feedback : ""
      }
      await kv.set(`resume:${uuid}`, JSON.stringify(data))
      setProcessingStatus("Generating feedback...")

      const feedback = await ai.feedback(
          uploadedFile.path,
          prepareInstructions(jobTitle, jobDescription)
      )
      if(!feedback) return setProcessingStatus("Error generating feedback")

      const feedbackText = typeof feedback.message.content === "string"
          ? feedback.message.content
          : feedback.message.content[0].text

        data.feedback = JSON.parse(feedbackText)
        await kv.set(`resume:${uuid}`, JSON.stringify(data))
        setProcessingStatus("Feedback generated")
      console.log(data)

  }

  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
      const form = e.currentTarget.closest("form")
      if(!form) return
      const formData = new FormData(form)

      const companyName = formData.get("company-name")  as string
      const jobTitle = formData.get("job-title")  as string
      const jobDescription = formData.get("job-description")  as string

      console.log({
          companyName, jobTitle, jobDescription, file
      })
      if(!file) return

      handleAnalyze({companyName, jobTitle, jobDescription, file })
  }

  return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        {/*NAVIGATION BAR*/}
        <Navbar />

        <section className="main-section">
          <div className="page-heading py-16">
            <h1>AI powered feedback for your dream job</h1>
            {/*isprocessing true hai toh first section execute hoga, and false hoga toh second section */}
            {isProcessing ? (
                <>
                  <h2>{processingStatus}</h2>
                  <img src="/images/resume-scan.gif" className="w-full" />
                </>
            ) : (
                <h2>Upload your resume to get started</h2>
            )}

            {!isProcessing && (
                <form id="upload-form" className="flex flex-col gap-4 mt-8" onSubmit={handleSubmit}>
                  <div className="form-div">
                    <label htmlFor="company-name">Company Name</label>
                    <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                  </div>
                  <div className="form-div">
                    <label htmlFor="job-title">Job Title</label>
                    <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                  </div>
                  <div className="form-div">
                    <label htmlFor="job-description">Job Description</label>
                    <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                  </div>
                  <div className="form-div">
                    <label htmlFor="uploader">Upload Resume</label>
                    <FileUploader onFileSelect={handleFileSelect}/>
                  </div>

                  <button className="primary-button" type="submit">
                    Analyze Resume
                  </button>
                </form>
            )}
          </div>

        </section>
      </main>
  )
}
export default Upload