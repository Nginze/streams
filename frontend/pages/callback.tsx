import { useContext, useEffect } from "react";

const Callback = () => {
  useEffect(() => {
    if (window.opener.location.pathname === "/login") {
      window.opener.location.replace("/home");
    }
    if (window.opener) {
      window.close();
    }
  });
  return <div style={{ marginTop: "6rem" }}>Please Wait ... </div>;
};

export default Callback;
