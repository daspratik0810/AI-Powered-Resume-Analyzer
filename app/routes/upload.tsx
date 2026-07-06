import React from 'react'
import Navbar from "~/components/Navbar";
import {type FormEvent, useState} from "react";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "~/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CVorithm " },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

const fileToDataUrl = async (file: File): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to data URL"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

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
     try {
         setIsProcessing(true)
         setProcessingStatus("Uploading resume...")
         const uploadedFile = await fs.upload([file])

         if(!uploadedFile) throw new Error("Error uploading file")

         setProcessingStatus("Analyzing resume and converting to image...")

         const imageFile = await convertPdfToImage(file)
         let uploadedImagePath = ""

         let previewImage = ""
         if (imageFile.file) {
             setProcessingStatus("Analyzing resume...")
             const uploadedImage = await fs.upload([imageFile.file])
             if(!uploadedImage) throw new Error("Error uploading image")
             uploadedImagePath = uploadedImage.path
             // We only store the uploaded image path in KV, not the full data URL.
             previewImage = ""
         } else {
             console.warn("PDF image conversion failed, continuing without image preview.", imageFile.error)
             setProcessingStatus("Resume uploaded. Continuing without image preview...")
             previewImage = ""
         }

         setProcessingStatus("Generating feedback...")

         const uuid = generateUUID()
         const data = {
             id : uuid,
             resumePath : uploadedFile.path,
             imagePath : uploadedImagePath,
             previewImage,
             companyName, jobTitle, jobDescription,
             feedback : null
         }
         await kv.set(`resume:${uuid}`, JSON.stringify(data))

         const feedback = await ai.feedback(
             uploadedFile.path,
             prepareInstructions({jobTitle, jobDescription})
         )
         if(!feedback) throw new Error("Error generating feedback")

         const feedbackText = typeof feedback.message.content === "string"
             ? feedback.message.content
             : (feedback.message.content[0] as any).text

         try {
             // Extract JSON from the response (handles cases where AI adds extra text or markdown)
             const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
             if (!jsonMatch) throw new Error("No JSON found in AI response");

             data.feedback = JSON.parse(jsonMatch[0]);
             await kv.set(`resume:${uuid}`, JSON.stringify(data));
             setProcessingStatus("Feedback generated");
             navigate(`/resume/${uuid}`)
         } catch (parseError) {
             console.error("JSON parsing error:", parseError);
             throw new Error("Error parsing feedback from AI. Please try again.");
         }

     } catch (error: any) {
         console.error(error);
         let errorMessage = "An error occurred during analysis";
         if (error instanceof Error) {
             errorMessage = error.message;
         } else if (error && typeof error === 'object' && error.message) {
             errorMessage = String(error.message);
         } else if (typeof error === 'string') {
             errorMessage = error;
         }

         setProcessingStatus(errorMessage);
         setTimeout(() => {
             setIsProcessing(false);
         }, 4000);
     }
  }


  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
      const form = e.currentTarget.closest("form")
      if(!form) return
      const formData = new FormData(form)

      const companyName = formData.get("company-name")  as string;
      const jobTitle = formData.get("job-title") as string;
      const jobDescription = formData.get("job-description")  as string;

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
                  <img src="/images/resume-scan.gif" className="w-full max-w-[480px] h-auto mx-auto mt-4 rounded-lg" />
                </>
            ) : (
                <h2>Upload Your Resume. Land More Interviews.</h2>
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