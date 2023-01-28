import { useContext, useEffect } from "react";

const Callback = () => {
  useEffect(() => {
    if (window.opener.location.pathname === "/") {
      window.opener.location.replace("/room/72a59400-edb3-4b55-a3eb-3d93d05790b5");
    }
    if (window.opener) {
      window.close();
    }
  });
  return <div style={{ marginTop: "6rem" }}>Please Wait ... </div>;
};

export default Callback;
