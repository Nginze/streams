import { createContext } from "react";
import { useQuery } from "react-query";
import { api } from "../api";
import { useRouter } from "next/router";

type Props = {
  children: React.ReactNode;
};

interface UContext {
  user: User;
  userLoading: boolean;
}
export const userContext = createContext<UContext>({} as UContext);

const UserProvider = ({ children }: Props) => {
  const getUser = async () => {
    const { data: user } = await api.get("/user");
    return user;
  };

  const { data: user, isLoading: userLoading } = useQuery("user", getUser, {
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });


  return (
    <userContext.Provider value={{ user, userLoading }}>
      {children}
    </userContext.Provider>
  );
};

export default UserProvider;
