import React from 'react';
import { ClipboardIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <button onClick={handleCopy} className="absolute right-4 top-4">
      {copied ? (
        <ClipboardDocumentCheckIcon className="h-5 w-5 text-arcon-green hover:text-arcon-light-green" />
      ) : (
        <ClipboardIcon className="h-5 w-5 text-arcon-green hover:text-arcon-light-green" />
      )}
    </button>
  );
};

export default CopyButton;