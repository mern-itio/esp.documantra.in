import React from "react";

export type ApiType = {
  name: string;
  endpoint: string;
  method: string;
  showFile: boolean;
  description: string;
};

type SidebarProps = {
  onApiSelect: (api: ApiType) => void;
  activeEndpoint: string;
  selectedApi: ApiType;
};

export const apiList: ApiType[] = [
  {
    name: "Envelope Upload",
    endpoint: "/api/api-service/sign/upload",
    method: "POST",
    showFile: true,
    description: "This endpoint is used to upload an envelope for signing.",
  },
  {
    name: "Users List",
    endpoint: "/api/v1/users",
    method: "GET",
    showFile: false,
    description: "This endpoint is used to Retrieve a list of users from the system.",
  },
];

function Sidebar({ onApiSelect, activeEndpoint }: SidebarProps): React.ReactElement {
    return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
      {apiList.map((api, idx) => (
        <button
          key={idx}
          onClick={() => onApiSelect(api)}
          className={`
            flex items-center justify-start w-full min-h-[56px] rounded-xl border
            px-4 sm:px-5 py-3 transition-all duration-100
            ${activeEndpoint === api.endpoint
              ? "bg-blue-50 border-blue-400 text-blue-900 font-bold shadow"
              : "bg-white hover:bg-blue-100 border-gray-200 text-gray-700"}
            outline-none
          `}
        >
          <span className={`
            flex items-center justify-center text-xs font-bold rounded px-3 py-1 mr-4
            ${api.method === "GET"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"}
            min-w-[52px] text-center
          `}>
            {api.method}
          </span>
          <span className="font-mono text-base break-all">{api.endpoint}</span>
        </button>
      ))}
    </div>
  );
}


export default Sidebar;
