import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCards";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CVorithm " },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv, fs } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    if(!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated])

  const loadResumes = async () => {
    setLoadingResumes(true);

    try {
      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      const parsedResumes = resumes
        .map((resume) => {
          if (!resume?.value || typeof resume.value !== 'string' || resume.value.trim() === '') {
            console.warn('Skipping invalid resume record', resume.key, resume.value);
            return null;
          }

          try {
            return JSON.parse(resume.value) as Resume;
          } catch (error) {
            console.warn('Skipping malformed resume JSON', resume.key, resume.value, error);
            return null;
          }
        })
        .filter((resume): resume is Resume => resume !== null);

      console.log('here is parsedResumes', parsedResumes);
      setResumes(parsedResumes);
    } catch (error) {
      console.error('Failed to load resumes from KV', error);
      setResumes([]);
    } finally {
      setLoadingResumes(false);
    }
  }

  useEffect(() => {
    loadResumes();
  }, [auth.isAuthenticated, kv]);

  const handleDeleteResume = async (id: string) => {
    try {
      const resumeToDelete = resumes.find(r => r.id === id);
      
      if (resumeToDelete) {
        // Delete image file from file system
        if (resumeToDelete.imagePath) {
          try {
            await fs.delete(resumeToDelete.imagePath);
          } catch (error) {
            console.error('Failed to delete image file:', error);
          }
        }
        
        // Delete resume from KV storage
        await kv.delete(`resume:${id}`);
        
        // Reload resumes list
        await loadResumes();
      }
    } catch (error) {
      console.error('Failed to delete resume:', error);
      alert('Failed to delete resume. Please try again.');
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && resumes?.length === 0 ? (
            <h2>No resumes found. Upload your first resume. Great careers begin with great resumes.
Upload your resume and let AI analyze every detail—from ATS compatibility to content quality—so you can apply with confidence.</h2>
          ) : (
            <h2>Keep all your resume analyses, ATS reports, and AI recommendations organized so you can apply with confidence.</h2>
          )}
        </div>
        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} onDelete={handleDeleteResume} />
            ))}
          </div>
        )}

        {!loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
