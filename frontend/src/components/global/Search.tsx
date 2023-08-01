import { SearchIcon } from "lucide-react";
import React from "react";

const Search = () => {
  return (
    <div
      style={{
        boxShadow: `inset 0 0 0.5px 1px hsla(0, 0%,   
              100%, 0.075),
              /* shadow ring 👇 */
              0 0 0 1px hsla(0, 0%, 0%, 0.05),
              /* multiple soft shadows 👇 */
              0 0.3px 0.4px hsla(0, 0%, 0%, 0.02),
              0 0.9px 1.5px hsla(0, 0%, 0%, 0.045),
              0 3.5px 6px hsla(0, 0%, 0%, 0.09)`,
      }}
      className="py-2 px-3 flex  items-center space-x-2  rounded-sm"
    >
      <SearchIcon size={15} />
      <input
        placeholder="Search"
        className="bg-transparent text-sm placeholder:text-sm placeholder:font-semibold outline-none"
      />
    </div>
  );
};

export default Search;
