import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerSuccess, registerFailure } from '../Redux/authSlice';
import axios from 'axios';
import { Navigation, Footer } from './imports'
import './../CSS/signup.css'

const CreateAcc = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { error } = useSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [err, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setError(null);

        switch (name) {
            case 'email':
                setEmail(value);
                break;
            case 'username':
                setUsername(value);
                break;
            case 'first_name':
                setFirstName(value);
                break;
            case 'last_name':
                setLastName(value);
                break;
            case 'password':
                setPassword(value);
                break;
            case 'confirm_password':
                setConfirmPassword(value);
                break;
            case 'agree_terms':
                setAgreeTerms(!agreeTerms);
                break;
            default:
                break;
        }
    };

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!agreeTerms) {
            setError('Please agree to the terms before registering.');
            dispatch(registerFailure("Please agree to the terms before"));
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            dispatch(registerFailure("Passwords don't match"));
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/register', {
                email,
                username,
                first_name: firstName,
                last_name: lastName,
                password,
                confirm_password: confirmPassword,
                agree_terms: agreeTerms,
            });

            if (response.status === 200) {
                const data = response.data;
                console.log('Registration successful', data);

                const originalDate = new Date(data.user.reg_date)
                const day = originalDate.getDate();
                const month = originalDate.getMonth() + 1;
                const year = originalDate.getFullYear();
                const formattedDate = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
                data.user.reg_date = formattedDate;

                dispatch(registerSuccess(data.user))
                navigate('/home');
            } else {
                setError(response.data.message);
                dispatch(registerFailure(response.data.message));
            }
        } catch (err) {
            if (err.response && err.response.status === 400) {
                setError(err.response.data.message)
            }
            else {
                setError('An unexpected error occurred')
                dispatch(registerFailure('An unexpected error occurred'));
            }
            console.error('Error during registration', err.message);
        }
    };

    return (
        <>
            <Navigation />
            <main className="signup-container">
                <form className="signup-form" onSubmit={handleSubmit}>
                    <h2 className='mb-3 text-xl font-bold text-gray-100'>Sign up to AniHub</h2>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            placeholder="Enter your email"
                            value={email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            required
                            placeholder="Choose a username"
                            value={username}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="first_name">First Name</label>
                        <input
                            type="text"
                            name="first_name"
                            id="first_name"
                            required
                            placeholder="Enter first name"
                            value={firstName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="last_name">Last Name</label>
                        <input
                            type="text"
                            name="last_name"
                            id="last_name"
                            placeholder="Enter last name"
                            value={lastName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group password">
                        <label htmlFor="password">Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group password">
                        <label htmlFor="confirm_password">Confirm Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="confirm_password"
                            id="confirm_password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={handleInputChange}
                        />
                        <span 
                            className={`flex mt-3 text-gray-300 toggle-password ${showPassword ? 'visible' : ''}`}
                            onClick={handleTogglePassword}
                        ></span>
                    </div>
                    <div className="form-group">
                        <input
                            type="checkbox"
                            id="terms"
                            name="agree_terms"
                            checked={agreeTerms}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="terms">You agree to our terms of service</label>
                    </div>
                    {err && <div className="error-message">{err}</div>}
                    <div className="form-group">
                        <button type="submit" className="signup-btn-form">
                            Sign Up
                        </button>
                    </div>
                </form>
            </main>
            <Footer />
        </>
    );
};

export default CreateAcc;
