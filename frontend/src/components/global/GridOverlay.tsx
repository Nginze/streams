export const GridOverlay = () => {
  return (
    <>
      <div className="absolute overflow-hidden inset-0 bg-[url(../public/grid.svg)] bg-center [mask-image:linear-gradient(180deg,rgba(255,255,255,0))]">
        <div className="grid-gradient"></div>
      </div>
    </>
  );
};
