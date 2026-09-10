import { signOut } from "firebase/auth";
import { api } from "../../utils/axois";
import { auth } from "../../utils/firebase";

async function logout() {
    try {
        await api.post("/api/auth/logout");
    } catch (err) {
        console.log(err);
    } finally {
        try {
            await signOut(auth);
        } catch (err) {
            console.log(err);
        }
    }
}

export default logout;
