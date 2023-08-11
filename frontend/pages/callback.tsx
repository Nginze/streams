import { useContext, useEffect } from "react";

const Callback = () => {
  useEffect(() => {
    if (window.opener && window.opener.location.pathname === "/login") {
      window.opener.location.replace("/home");
    } else {
      window.location.replace('/home')
    }

    if (window.opener) {
      window.close();
    }
  });
  return (
    <div
      className="w-screen h-screen bg-app_bg_deepest text-white flex items-center justify-center"
    >
      Please Wait ...{" "}
    </div>
  );
};

export default Callback;
