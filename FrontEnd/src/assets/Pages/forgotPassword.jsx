import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navigation, Footer } from './imports'
import './../CSS/newlogin.css'

const forgotPassword = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [err, setError] = useState(null);
    const [isSendRecoveryMode, setIsSendRecoveryMode] = useState(true);

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'email') setEmail(value);
        else if (name === 'password') setPassword(value);
        else if (name === 'username') setUsername(value);
        else if (name === 'token') setToken(value);

        setError(null);
    }

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    }

    const handleSendToken = async () => {
        try {

            const response = await axios.post('http://localhost:5000/login/forgot-password-req', {
                email: email,
            })


            if (response.data.success) {
                setIsSendRecoveryMode(false);
            } else {
                setError(response.data.message);
            }
        } catch (error) {
            setError('An unexpected error occurred')
            console.error('Error during password recovery request: ', error.message);
        }
    }

    const handleConfirm = async () => {
        try {
            const response = await axios.post('http://localhost:5000/login/rest-password', {
                username: username,
                token: token,
                newPassword: password,
            })

            if (response.data.success) {
                navigate('/login')
            } else {
                setError(response.data.message);
            }
        } catch (error) {
            setError(error.message)
            console.error('Error during password reset confirmation: ', error.message);
        }
    }

    return (
        <>
            <Navigation />
            <main className="login-container">
                <div className='creative-content'>
                </div>
                <div className='login-section'>
                    <form className="login-form">
                        {isSendRecoveryMode ? (
                            <>
                                <h2 className='text-xl   mb-4 pb-1'>Password Recovery</h2>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="text"
                                        name="email"
                                        id="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                {err && <div className="error-message">{err}</div>}
                                <div className="form-group">
                                    <button type="button" className="login-btn-form" onClick={handleSendToken}>Send Recovery Code</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className='text-xl mb-4 pb-1'>New Password</h2>
                                <div className="form-group">
                                    <label htmlFor="username">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="token">Token</label>
                                    <input
                                        type="text"
                                        name="token"
                                        id="token"
                                        placeholder="Enter your token"
                                        value={token}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">New Password</label>
                                    <div className="form-group password">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            id="password"
                                            placeholder="Enter your new password"
                                            value={password}
                                            onChange={handleInputChange}
                                        />
                                        <span
                                            className={`toggle-password ${showPassword ? 'visible' : ''}`}
                                            onClick={handleTogglePassword}
                                        >
                                        </span>
                                    </div>
                                </div>
                                {err && <div className="error-message">{err}</div>}
                                <div className="form-group">
                                    <button type="button" className="login-btn-form" onClick={handleConfirm}>Confirm</button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </main>
            <Footer />
        </>
    )
}

export default forgotPassword