import React from "react";
import { Oval } from "react-loader-spinner";

type Props = {
  bgColor?: string;
  textColor?: string;
  message?: string;
  width?: number;
  height?: number;
  strokeWidth?: string;
};

const Loader = ({
  bgColor,
  textColor,
  message,
  width,
  height,
  strokeWidth,
}: Props) => {
  return (
    <>
      <div className="flex justify-center mt-10 mx-auto">
        <Oval
          height={height ? height : 70}
          width={width ? width : 70}
          color={bgColor}
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
          ariaLabel="oval-loading"
          secondaryColor={bgColor}
          strokeWidth={strokeWidth ? strokeWidth : 2}
          strokeWidthSecondary={2}
        />
      </div>
      <div className="flex justify-center mx-auto">
        <h3 style={{ color: textColor }} className={` font-semibold text-l`}>
          {message}
        </h3>
      </div>
    </>
  );
};

export default Loader;
