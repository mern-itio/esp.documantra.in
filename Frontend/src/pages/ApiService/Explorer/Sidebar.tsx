import React from "react";

export type ApiType = {
  name: string;
  endpoint: string;
  method: string;
  showFile: boolean;
  showBody: boolean;
  showEnvelopeId: boolean;
  showDocumentId?: boolean;
  bodyTemplate:string;
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
    showBody: false,
    showEnvelopeId: false,
    bodyTemplate: ""
  },
  {
    name: "Add Recipient",
    endpoint: "/api/api-service/sign/add-recipients",
    method: "POST",
    showFile: false,
    description: "This endpoint is used to add recipient.",
    showBody: true,
    showEnvelopeId: false,
    bodyTemplate: `{
  "envelopeId": "",
  "recipients": [
    {
      "name": "",
      "email": "",
      "role": "signer",
      "order": 1,
      "status": "waiting",
      "authentication": "email"
    }
  ]
}`
  },
  {
    name: "Fetch Envelope Details",
    endpoint: "/api/api-service/sign/envelope/:id",
    method: "GET",
    showFile: false,
    description: "This endpoint is used to fetch envelope details by its id.",
    showBody: false,
    showEnvelopeId: true,
    bodyTemplate: ""
  },
  {
    name: "Save signature Fields",
    endpoint: "/api/api-service/sign/save-signature-fields",
    method: "POST",
    showFile: false,
    description: "This endpoint is used to save signature fields on document.",
    showBody: true,
    showEnvelopeId: false,
    bodyTemplate: `{
  "envelopeId": "",
  "signatureFields": [
    {
      "documentId": "",
      "recipientId": "",
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 120,
      "height": 50,
      "type": "signature",
      "status": "pending"
    }
  ]
}`
  },
  {
    name: "Update Envelope",
    endpoint: "/api/api-service/sign/update",
    method: "POST",
    showFile: false,
    description: "This endpoint is used to update envelope.",
    showBody: true,
    showEnvelopeId: false,
    bodyTemplate: `{
  "envelopeId": "",
  "envelopeData": {
    "subject": "",
    "message": "",
    "priority": "normal",
    "signingOrder": "In-Order",
    "expiresAt": "2025-08-30T10:00:00Z",
    "reminderEnabled": true,
    "reminderInterval": 2,
    "requireAllSignatures": true,
    "allowDecline": false,
    "signatureType": "standard",
    "status": "draft"
  }
}`
  },
  {
    name: "Send Envelope",
    endpoint: "/api/api-service/sign/send/:id",
    method: "PUT",
    showFile: false,
    description: "This endpoint is used to send envelope to recipients.",
    showBody: false,
    showEnvelopeId: true,
    bodyTemplate: ""
  },
  {
    name: "Get Signature Fields",
    endpoint: "/api/api-service/sign/signature/:id",
    method: "GET",
    showFile: false,
    description: "This endpoint is used to get all signature fields.",
    showBody: false,
    showEnvelopeId: false,
    showDocumentId: true,
    bodyTemplate: ""
  },
   {
    name: "Add Signature",
    endpoint: "/api/api-service/sign/add-signature",
    method: "POST",
    showFile: false,
    description: "This endpoint is used to add signature.",
    showBody: true,
    showEnvelopeId: false,
    bodyTemplate: `{
  "fieldId": "",
  "signature": ""
}`
  },
];


function Sidebar({ onApiSelect, activeEndpoint }: SidebarProps): React.ReactElement {
    return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto ">
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
