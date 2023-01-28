import axios from "axios";
import { createContext } from "react";
import { useQuery } from "react-query";

type Props = {
  children: React.ReactNode;
};

interface Context {
  data: {
    userid: string;
    avatarurl: string;
    bio: string;
    username: string;
    email: string;
    displayName: string;
  };
  isLoading: boolean;
}
export const userContext = createContext<Context>({} as Context);

const UserProvider = ({ children }: Props) => {
  const BASE_URL = "http://localhost:8000/auth/callback";
  const getUser = async () => {
    const user = await axios({
      method: "get",
      url: "https://192.168.7.131:8000/user",
      withCredentials: true,
    });
    return user.data.user;
  };

  const { data, isLoading } = useQuery("user", getUser);

  return (
    <userContext.Provider value={{ data, isLoading }}>
      {children}
    </userContext.Provider>
  );
};

export default UserProvider;
