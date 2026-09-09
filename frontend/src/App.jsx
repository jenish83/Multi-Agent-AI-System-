import React, { useEffect } from 'react'
import Home from './pages/Home';
import getCurrentUser from './features/getcurrentuser';
import { useDispatch } from 'react-redux';
import { setUserData } from './redux/userSlice';

const App = () => {

  const dispatch = useDispatch();
  useEffect(() => {
    const getUser = async () => {
      const user = await getCurrentUser();
      dispatch(setUserData(user));
    }
    getUser();
  }, []);
  return (
    <>
    <Home />
    </>
  )
}

export default App
