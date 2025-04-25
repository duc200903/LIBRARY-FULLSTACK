import { useNavigate } from "react-router"
import { useAuthStore } from "../store/authStore"
import { useEffect } from "react";

const RedirectAuthenticatedUsers = ({children}) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if(user){
            navigate("/")
        }
    }, [user, navigate]);

    if(user){
        return null;
    }
  return <>{children}</>
}

export default RedirectAuthenticatedUsers