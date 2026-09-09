import { api } from "../../utils/axois";


const getCurrentUser = async () => {

    try{
        const { data } = await api.get("/api/me");
        return data;
    }catch(error){
        if (error.response?.status === 401) {
            return null;
        }
        console.error(error);
    }
}

export default getCurrentUser;