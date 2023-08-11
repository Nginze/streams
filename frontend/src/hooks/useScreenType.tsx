import { useMediaQuery } from "react-responsive";

const useScreenType = () => {
  const isDesktopOrLaptop = useMediaQuery({
    query: "(min-width: 1224px)",
  });

  const isTablet = useMediaQuery({
    query: "(min-width: 768px) and (max-width: 1223px)",
  });

  const isMobile = useMediaQuery({
    query: "(max-width: 767px)",
  });

  const isBigScreen = useMediaQuery({ query: "(min-width: 1824px)" });
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });
  const isRetina = useMediaQuery({ query: "(min-resolution: 2dppx)" });

  if (isBigScreen) {
    return "isBigScreen";
  } else if (isDesktopOrLaptop) {
    return "isDesktop";
  } else if (isTablet) {
    return "isTablet";
  } else if (isMobile) {
    return "isMobile";
  } else if (isPortrait) {
    return "isPortrait";
  } else {
    return "isRetina";
  }
};

export default useScreenType;
