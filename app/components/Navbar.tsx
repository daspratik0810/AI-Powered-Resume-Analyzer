//it is a functional component of react
import React from 'react'
import {Link} from "react-router";

const Navbar = () => {
  return (
    <nav className="navbar">
        {/*it is coming from react-router, clicking "CVortithm" will lead to home directory*/}
        <Link to="/">
            <p className="text-2xl font-bold text-gradient">CVorithm</p>
        </Link>

        {/*it is coming from react-router, clicking "Upload Resume" will lead to upload directory*/}
        <Link to="/upload" className="primary-button w-fit">
            Upload Resume
        </Link>

    </nav>
  )
}

export default Navbar