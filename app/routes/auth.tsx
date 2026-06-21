import React, {useEffect} from 'react'
import {usePuterStore} from "~/lib/puter";
import {useLocation, useNavigate} from "react-router";

export const meta = () => ([
    {title: "CVorithm | Auth"},
    {name: "description", content: "Please log into your account"},
])

const Auth = () => {
    //it is a custom hook created in puter.js, so we can simply import and use it
    const {isLoading, auth} = usePuterStore();
    const location = useLocation()
    const next = new URLSearchParams(location.search).get("next") || "/"
    const navigate = useNavigate()

    //useEffect is a react hook that runs after the component has been rendered and dependencies is changed.
    //when a user tries to access a secure route but they are not authenticated, then user is re-directed to auth again,that means they are blocked at auth. But if the user is authenticated then it will directed/navigated to the next page where they want to be directed
    useEffect( () =>{
        if(auth.isAuthenticated) navigate(next)
    }, [auth.isAuthenticated, next, navigate])

    return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
        <div className="gradient-border shadow-lg">
            <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1>Welcome Back to CVorithm</h1>
                    <h2>Log In to Transform Your Resume into Opportunities</h2>
                </div>

                <div>
                    {isLoading ? (
                        <button className="auth-button animate-pulse">
                            <p>Signing you in shortly...</p>
                        </button>
                    ) : (
                        <>
                            {auth.isAuthenticated ? (
                                <button className="auth-button" onClick={auth.signOut} >
                                    <p>Log Out</p>
                                </button>
                            ) : (
                                <button className="auth-button" onClick={auth.signIn} >
                                    <p>Log In</p>
                                </button>
                            )}
                        </>
                    )}

                </div>
            </section>
        </div>
    </main>
  )
}

export default Auth