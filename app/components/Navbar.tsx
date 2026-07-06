//it is a functional component of react
import React from 'react'
import {Link, useNavigate} from "react-router";
import {usePuterStore} from "~/lib/puter";

const Navbar = () => {
  const navigate = useNavigate();
  const { auth } = usePuterStore();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } finally {
      navigate('/auth');
    }
  };

  return (
    <nav className="navbar">
        {/*it is coming from react-router, clicking "CVortithm" will lead to home directory*/}
        <Link to="/">
            <p className="text-2xl font-bold text-gradient">CVorithm</p>
        </Link>

        <div className="flex items-center gap-3">
          {/*it is coming from react-router, clicking "Upload Resume" will lead to upload directory*/}
          <Link to="/upload" className="primary-button w-fit">
              Upload Resume
          </Link>

          {auth.isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </button>
          )}
        </div>
    </nav>
  )
}

export default Navbar