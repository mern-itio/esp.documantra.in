import type { ApiType } from './Sidebar';

function renderFields(api: ApiType) {
      if (api.name === "Envelope Upload") {
    return (
      <div className="text-xs mb-3">
        <div>
          <span className="font-bold">files:</span> <span className="text-gray-600">PDF, DOC, DOCX files (max 10MB each)</span>
          <div className="text-gray-500 ml-5 text-xs">
            Only PDF, DOC, DOCX files up to 10MB each are supported.
          </div>
        </div>
      </div>
    );
  }
  if (api.name === "Add Recipient") {
    return (
      <div className="text-xs mb-3">
        <div>
          <span className="font-bold">envelopeId:</span> <span className="text-gray-600">string (MongoDB ObjectId)</span>
        </div>
        <div className="mt-2">
          <span className="font-bold">recipients:</span> <span className="text-gray-600">[</span>
          <div className="ml-6">
            <span className="text-gray-500">// Array of objects</span>
            <ul className="list-disc ml-2 md:ml-6 mt-2 md:mt-1 break-words">
              <li><span className="font-bold">name:</span> <span className="text-gray-600">string</span></li>
              <li><span className="font-bold">email:</span> <span className="text-gray-600">string (e.g. <span className="underline">email@example.com</span>)</span></li>
              <li>
                <span className="font-bold">role:</span> <span className="text-blue-700">"signer"</span>, <span className="text-blue-700">"approver"</span>, <span className="text-blue-700">"carbon_copy"</span>, <span className="text-blue-700">"in_person_signer"</span>
              </li>
              <li><span className="font-bold">order:</span> <span className="text-gray-600">number</span></li>
              <li><span className="font-bold">status:</span> <span className="text-blue-700">"waiting"</span>, <span className="text-blue-700">"sent"</span>, <span className="text-blue-700">"completed"</span>, <span className="text-blue-700">"declined"</span></li>
              <li><span className="font-bold">authentication:</span> <span className="text-blue-700">"email"</span>, <span className="text-blue-700">"sms"</span>, <span className="text-blue-700">"access_code"</span>, <span className="text-blue-700">"phone"</span></li>
            </ul>
          </div>
          <span className="text-gray-600">]</span>
        </div>
      </div>
    );
  }
  if (api.name === "Fetch Envelope Details") {
    return (
        <div className="text-xs mb-3">
        <div>
            <span className="font-bold">envelopeId:</span>{" "}
            <span className="text-gray-600">string (MongoDB ObjectId)</span>
        </div>
        </div>
    )}
    if (api.name === "Save signature Fields") {
  return (
    <div className="text-xs mb-3">
      <div>
        <span className="font-bold">envelopeId:</span> <span className="text-gray-600">string (MongoDB ObjectId)</span>
      </div>
      <div className="mt-2">
        <span className="font-bold">signatureFields:</span> <span className="text-gray-600">[</span>
        <div className="ml-6">
          <span className="text-gray-500">// Array of objects</span>
          <ul className="list-disc ml-2 md:ml-6 mt-2 md:mt-1 break-words">
            <li><span className="font-bold">documentId:</span> string</li>
            <li><span className="font-bold">recipientId:</span> string</li>
            <li><span className="font-bold">page:</span> number</li>
            <li><span className="font-bold">x:</span> number (X coordinate)</li>
            <li><span className="font-bold">y:</span> number (Y coordinate)</li>
            <li><span className="font-bold">width:</span> number</li>
            <li><span className="font-bold">height:</span> number</li>
            <li>
              <span className="font-bold">type:</span> 
              <span className="text-blue-700">"signature"</span>, 
              <span className="text-blue-700">"initials"</span>,
              <span className="text-blue-700">"date"</span>,
              <span className="text-blue-700">"text"</span>,
              <span className="text-blue-700">"checkbox"</span>
            </li>
            <li>
              <span className="font-bold">status:</span> 
              <span className="text-blue-700">"pending"</span>, 
              <span className="text-blue-700">"completed"</span>,
              <span className="text-blue-700">"declined"</span>
            </li>
          </ul>
        </div>
        <span className="text-gray-600">]</span>
      </div>
    </div>
  )
}
if (api.name === "Update Envelope") {
  return (
    <div className="text-xs mb-3">
  <div>
    <span className="font-bold">envelopeId:</span> <span className="text-gray-600">string (MongoDB ObjectId)</span>
  </div>
  <div className="mt-2">
    <span className="font-bold">envelopeData:</span> <span className="text-gray-600">&#123;</span>
    <div className="ml-6">
      <ul className="list-disc ml-2 md:ml-6 mt-2 md:mt-1 break-words">
        <li><span className="font-bold">subject:</span> <span className="text-gray-600">string</span></li>
        <li><span className="font-bold">message:</span> <span className="text-gray-600">string</span></li>
        <li>
          <span className="font-bold">priority:</span> 
          <span className="text-blue-700">"low"</span>, 
          <span className="text-blue-700">"normal"</span>, 
          <span className="text-blue-700">"high"</span>,
          <span className="text-blue-700">"urgent"</span>
        </li>
        <li>
          <span className="font-bold">signingOrder:</span>
          <span className="text-blue-700">"In-Order"</span>,
          <span className="text-blue-700">"Parallel"</span>, 
          <span className="text-blue-700">"sequential"</span>
        </li>
        <li><span className="font-bold">expiresAt:</span> <span className="text-gray-600">ISO String (e.g. 2025-08-30T10:00:00Z)</span></li>
        <li><span className="font-bold">reminderEnabled:</span> <span className="text-gray-600">boolean</span></li>
        <li><span className="font-bold">reminderInterval:</span> <span className="text-gray-600">number</span></li>
        <li><span className="font-bold">requireAllSignatures:</span> <span className="text-gray-600">boolean</span></li>
        <li><span className="font-bold">allowDecline:</span> <span className="text-gray-600">boolean</span></li>
        <li>
          <span className="font-bold">signatureType:</span> 
          <span className="text-blue-700">"standard"</span>, 
          <span className="text-blue-700">"advanced"</span>, 
          <span className="text-blue-700">"qualified"</span>
        </li>
        <li>
          <span className="font-bold">status:</span>
          <span className="text-blue-700">"draft"</span>,
          <span className="text-blue-700">"in-progress"</span>,
          <span className="text-blue-700">"completed"</span>
        </li>
      </ul>
    </div>
    <span className="text-gray-600">&#125;</span>
  </div>
</div>
  )}
  if (api.name === "Send Envelope") {
    return (
        <div className="text-xs mb-3">
        <div>
            <span className="font-bold">envelopeId:</span>{" "}
            <span className="text-gray-600">string (MongoDB ObjectId)</span>
        </div>
        </div>
    )}
    if (api.name === "Get Signature Fields") {
    return (
        <div className="text-xs mb-3">
        <div>
            <span className="font-bold">documentId:</span>{" "}
            <span className="text-gray-600">string (MongoDB ObjectId)</span>
        </div>
        </div>
    )}
      if (api.name === "Add Signature") {
    return (
      <div className="text-xs mb-3">
    <div>
        <span className="font-bold">fieldId:</span> <span className="text-gray-600">string (Signature Field ObjectId)</span>
    </div>
    <div className="mt-1">
        <span className="font-bold">signature:</span> <span className="text-gray-600">string (Signed Value / Name / Base64, etc.)</span>
    </div>
    </div>
    );
  }
  // fallback logic for others...
  if (api.showBody && api.bodyTemplate) {
    try {
      const parsed = JSON.parse(api.bodyTemplate);
      return (
        <pre className="bg-gray-100 p-2 md:p-3 rounded-md text-xs md:text-sm font-mono text-gray-900 overflow-x-auto max-w-full break-words">{JSON.stringify(parsed, null, 2)}</pre>
      );
    } catch {
      return <pre>{api.bodyTemplate}</pre>;
    }
  }
  return null;
}

function renderSuccess(api: ApiType) {
   if (api.name === "Envelope Upload") {
    return (
      <>
        <div className="mb-2 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          <span className="font-mono text-xs text-green-700">HTTP 200 – Success</span>
        </div>
        <pre className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-900 overflow-x-auto">{`{
  "status": "success",
  "message": "Files uploaded successfully",
  "data": {
    "envelopeId": "12345"
  }
}`}</pre>
      </>
    )
};
  if(api.name === "Add Recipient") {
    return (
      <>
        <div className="mb-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
        <span className="font-mono text-xs text-green-700">HTTP 200 – Success</span>
        </div>
        <pre className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-900 overflow-x-auto">{`{
    "status": "success",
    "message": "Recipients processed successfully",
    "envelopeId": "12345",
    "recipientIds": [
        "12345"
    ]
}`}</pre>
      </>
    );
  }
    if(api.name === "Fetch Envelope Details") {
    return (
      <>
      <div className="mb-2 flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
    <span className="font-mono text-xs text-green-700">HTTP 200 – Success</span>
    </div>
    <pre className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-900 overflow-x-auto">{`{
  "status": "success",
  "data": {
    "id": "123456",
    "subject": "Updated Subject",
    "status": "completed",
    "priority": "normal",
    "createdAt": "2025-08-27T05:12:58.972Z",
    "sentAt": "2025-08-27T06:50:05.133Z",
    "expiresAt": "2025-08-30T10:00:00.000Z",
    "sender": {
      "id": "123456",
      "name": "example",
      "email": "email@example.com",
      "role": "sender",
      "organization": "org",
      "avatar": ""
    },
    "signatureType": "standard",
    "documents": [
      {
        "id": "123456",
        "name": "name.pdf",
        "size": 708271,
        "type": "application/pdf"
      }
    ],
    "recipients": [
      {
        "id": "123456",
        "name": "name",
        "email": "email@example.com",
        "role": "signer",
        "order": 1,
        "status": "sent",
        "authentication": "email"
      }
    ]
  }
}`}</pre>
      </>
    )
    }
    if (api.name === "Save signature Fields") {
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
        <span className="font-mono text-xs text-green-700">HTTP 200 – Success</span>
      </div>
      <pre className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-900 overflow-x-auto">{`{
  "status": "success",
  "message": "Signature fields added successfully",
  "data": {
    "envelopeId": "123456"
  }
}`}</pre>
    </>
  )
}
    if (api.name === "Update Envelope") {
  return (
    <>
        <div className="mb-2 flex items-center gap-2">
  <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
  <span className="font-mono text-xs text-green-700">HTTP 200 – Success</span>
</div>
<pre className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-900 overflow-x-auto">{`{
  "status": "success",
  "message": "Envelope updated successfully",
  "envelopeId": "123456"
}`}</pre>
    </>
  )}
  if (api.name === "Send Envelope") {
  return (
    <>
    <div className="mb-2 flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
    <span className="font-mono text-xs text-green-700">HTTP 200 – Success</span>
    </div>
    <pre className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-900 overflow-x-auto">{` "Envelope sent to recipients"
    `}</pre>
    </>
    )}
    if (api.name === "Get Signature Fields") {
  return (
    <>
  <div className="mb-2 flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
    <span className="font-mono text-xs text-green-700">HTTP 200 – Success</span>
  </div>
  <pre className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-900 overflow-x-auto">{`{
  "status": "success",
  "signatureFields": [
    {
      "_id": "123456",
      "envelopeId": "123456",
      "documentId": "123456",
      "recipientId": "123456",
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 120,
      "height": 50,
      "type": "signature",
      "status": "pending",
      "createdAt": "2025-08-27T07:15:30.668Z",
      "updatedAt": "2025-08-27T07:15:30.668Z",
      "__v": 0
    }
  ]
}`}</pre>
</>
    )}
    if (api.name === "Add Signature") {
  return (
    <>
    <div className="mb-2 flex items-center gap-2">
  <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
  <span className="font-mono text-xs text-green-700">HTTP 200 – Success</span>
    </div>
    <pre className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-900 overflow-x-auto">{`{
    "status": "success",
    "message": "Signature added successfully",
    "data": {
        "fieldId": "123456",
        "signature": "signature"
    }
    }`}</pre>
    </>
  )}
  // fallback for other APIs or generic success
  return null;
}
function UseCaseBlock({ selectedApi }: { selectedApi: ApiType }): React.ReactElement {
  return (
     <div className="w-full min-w-0 p-3 md:p-4 rounded-lg bg-gray-50 border shadow-sm">
      <div className="font-bold text-sm mb-2">Request Fields</div>
      {renderFields(selectedApi)}
      <div className="font-bold text-sm mb-2 mt-2">Success Response</div>
      {renderSuccess(selectedApi)}
    </div>
  );
}

export default UseCaseBlock;
