import { createSlice } from '@reduxjs/toolkit';

const loadUserFromStorage = () => {
    try {
        const user = localStorage.getItem('user');
        if (user === null) {
            return null;
        }
        const lastActiveTimestamp = localStorage.getItem('lastActiveTimestamp');
        if (lastActiveTimestamp && Date.now() - parseInt(lastActiveTimestamp, 10) > 3600000) {
            localStorage.removeItem('user');
            return null;
        }
        return JSON.parse(user);
    } catch (error) {
        console.error('Error loading user from storage ', error)
        return null;
    }
}

const saveUserToStorage = (user) => {
    try {
        const serializedUser = JSON.stringify(user);
        localStorage.setItem('user', serializedUser);
        localStorage.setItem('lastActiveTimestamp', Date.now().toString());
    } catch (error) {
        console.error('Error saving user to storage ', error)
    }
}

window.addEventListener('unload', () => {
    localStorage.setItem('lastActiveTimestamp', Date.now().toString());
});

const initialState = {
    user: loadUserFromStorage(),
    error: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.user = action.payload;
            state.error = null;
            saveUserToStorage(action.payload);
        },
        loginFailure: (state, action) => {
            state.user = null;
            state.error = action.payload;
            localStorage.removeItem('user');
        },
        logout: (state) => {
            state.user = null;
            state.error = null;
            localStorage.removeItem('user');
        },
        registerSuccess: (state, action) => {
            state.user = action.payload;
            state.error = null;
        },
        registerFailure: (state, action) => {
            state.user = null;
            state.error = action.payload;
        },
        updateUser: (state, action) => {
            state.user = action.payload;
            state.error = null;
            saveUserToStorage(action.payload);
        },
        updateFailure: (state, action) => {
            state.error = null;
        },
        changePassword: (state, action) => {
            state.user = action.payload;
            state.error = null;
        },
        changePasswordFailure: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {
    loginSuccess,
    loginFailure,
    logout,
    registerSuccess,
    registerFailure,
    updateUser,
    updateFailure,
    changePassword,
    changePasswordFailure
} = authSlice.actions;
export default authSlice.reducer;
