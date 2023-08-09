import { useMediaQuery } from "react-responsive";

const useScreenType = () => {
  const isDesktop = useMediaQuery({ minWidth: 800 });

  if (isDesktop) {
    return "desktop";
  }

  return "fullscreen";
};

export default useScreenType;
