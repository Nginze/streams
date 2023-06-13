import { createContext } from "react";
import { useQuery } from "react-query";
import { apiClient } from "../lib/apiclient/client";

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
    const { data: user } = await apiClient.get("/user");
    return user;
  };

  const { data: user, isLoading: userLoading } = useQuery("user", getUser);

  return (
    <userContext.Provider value={{ user, userLoading }}>
      {children}
    </userContext.Provider>
  );
};

export default UserProvider;
