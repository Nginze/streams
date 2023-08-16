import { userContext } from "@/contexts/UserContext";
import React, { createContext, useContext, useEffect, useState } from "react";

interface UserColorContextType {
  userColor: string | undefined;
}

export const userColorContext = createContext<UserColorContextType>(
  {} as UserColorContextType
);

const UserColorProvider = ({
  children,
}: {
  children: React.ReactNode[] | React.ReactNode;
}) => {
  const [userColor, setUserColor] = useState("");
  const { user, userLoading } = useContext(userContext);

  useEffect(() => {
    if (!userLoading && user) {
      const color = stringToColor(user.userId);
      setUserColor(color);
    }
  }, [user, userLoading]);

  return (
    <userColorContext.Provider value={{ userColor }}>
      {children}
    </userColorContext.Provider>
  );
};

function stringToColor(str: string) {
  if(!str){
    return "white"
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = Math.floor(
    Math.abs((Math.sin(hash) * 16777215) % 1) * 16777215
  ).toString(16);
  return `#${"000000".slice(color.length)}${color}`;
}

export default UserColorProvider;
