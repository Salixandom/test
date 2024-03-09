import { BrowserRouter as Router, Route, Routes, useParams } from 'react-router-dom';
import { Index, Home, LogIn, ForgotPassword, CreateAcc, Profile, Navigation, Browse, AnimePage, SearchPage, Footer, UserProfile, Forum, ForumFeed, Request } from './assets/Pages/imports'
import ScrollToTop from './assets/ScrollToTop'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <ScrollToTop />
      {/* <Navigation /> */}
      <ToastContainer />
      <Routes>
        <Route path="/" Component={Index} />
        <Route path="/login" Component={LogIn} />
        <Route path="/login/forgotPassword" Component={ForgotPassword} />
        <Route path="/register" Component={CreateAcc} />
        <Route path="/home" Component={Home} />
        <Route path="/browse" Component={Browse} />
        <Route path='/profile' Component={Profile} />
        <Route path='/user-profile/:userID' Component={UserProfile} />
        <Route path='/anime/:id' Component={AnimePage} />
        <Route path='/forum/:forumId' Component={Forum} />
        <Route path='/search' Component={SearchPage} />
        <Route path='/forums-feed' Component={ForumFeed} />
        <Route path='/request' Component={Request} />
      </Routes>
      {/* <Footer /> */}
    </Router>
  )
}

export default App
