import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginSuccess, loginFailure } from '../Redux/authSlice';
import axios from 'axios';
import { Navigation, Footer } from './imports'
import './../CSS/newlogin.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LogIn = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { error } = useSelector((state) => state.auth);
    const [emailUsername, setEmailUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [err, setError] = useState(null)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        if (name === 'email_username')
            setEmailUsername(value)
        else if (name === 'password')
            setPassword(value)
        setError(null)
    }

    const handleTogglePassword = () => {
        setShowPassword(!showPassword)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5000/login', {
                email_username: emailUsername,
                password: password,
            });

            if (response.status === 200) {
                const data = response.data;
                toast.success("Welcome back " + response.data.user.display_name);

                const originalDate = new Date(data.user.reg_date)
                const day = originalDate.getDate();
                const month = originalDate.getMonth() + 1;
                const year = originalDate.getFullYear();
                const formattedDate = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
                data.user.reg_date = formattedDate;

                dispatch(loginSuccess(data.user))
                navigate('/home')
            }
            else {
                setError(response.data.message);
                toast.error(response.data.message);
                dispatch(loginFailure(response.data.message))
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError(err.response.data.message)
                toast.error(response.data.message);
            }
            else {
                setError('An unexpected error occurred')
                toast.error(response.data.message);
            }
            console.error('Error during login', err.message);
        }
    }

    return (
        <>
            <Navigation />
            <main className="login-container">
                <div className='creative-content'>
                </div>
                <div className='login-section'>
                    <form className="login-form" onSubmit={handleSubmit}>
                        <h2 className='text-xl border-b border-blue-800 w-1/12 mb-4 pb-1'>Login</h2>
                        <div className="form-group">
                            <label htmlFor="email_username">Email or Username</label>
                            <input
                                type="text"
                                name="email_username"
                                id="email_username"
                                placeholder="Enter your email or username"
                                value={emailUsername}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password" className='pass'>Password</label>
                            <div className="form-group password">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    id="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={handleInputChange}
                                />
                                <span
                                    className={`flex mt-3 toggle-password ${showPassword ? 'visible' : ''}`}
                                    onClick={handleTogglePassword}
                                >
                                </span>
                            </div>
                        </div>
                        <div className="form-group flex">
                            <input type="checkbox" id="robotCheck" className='mr-2'/>
                            <label htmlFor="robotCheck" className='translate-y-1.5'>I'm not a robot</label>
                        </div>
                        {err && <div className="error-message">{err}</div>}
                        <div className="form-group">
                            <button type="submit" className="login-btn-form">Login</button>
                        </div>
                        <div className="form-links">
                            <Link to="/login/forgotPassword">Forgot password?</Link>
                            <Link to="/register">Not registered? Create an account</Link>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </>
    )
}

export default LogIn