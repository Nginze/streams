import React from "react";
import { Oval, RotatingLines } from "react-loader-spinner";

type Props = {
  bgColor?: string;
  textColor?: string;
  message?: string;
  width?: number;
  height?: number;
  strokeWidth?: string;
  alt?: boolean;
};

const Loader = ({
  bgColor,
  textColor,
  message,
  width,
  height,
  strokeWidth,
  alt,
}: Props) => {
  if (alt) {
    return (
      <>
        <RotatingLines
          width={width ? `${width}` : "70"}
          animationDuration="0.75"
          strokeColor="grey"
          strokeWidth="5"
          visible={true}
        />
      </>
    );
  }
  return (
    <>
      <div className="flex justify-center mx-auto">
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
