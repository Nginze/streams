import axios from "axios";
import { Router, useRouter } from "next/router";
import { createContext, useEffect } from "react";
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
  const getUser = async () => {
    const user = await axios({
      method: "get",
      url: "http://localhost:8000/user",
      withCredentials: true,
    });
    return user.data.user;
  };

  const router = useRouter()
  const { data, isLoading } = useQuery("user", getUser);

  return (
    <userContext.Provider value={{ data, isLoading }}>
      {children}
    </userContext.Provider>
  );
};

export default UserProvider;
