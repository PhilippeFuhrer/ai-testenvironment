import React from 'react';
import { ClipboardIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";


const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false);

  // Convert markdown to a format better suited for Word
  const convertMarkdownForWord = (text: string): string => {
    // Handle tables - convert markdown tables to tab-separated values
    // Word can interpret tab-separated values as tables
    let converted = text.replace(/\|(.+?)\|/g, (match, content) => {
      return content.split('|').join('\t');
    });
    
    // Remove markdown table separators (rows with dashes and pipes)
    converted = converted.replace(/\|(\s*[-:]+[-:|\s]*)+\|\n/g, '');
    
    // Handle headings
    converted = converted.replace(/^### (.*?)$/gm, '$1');
    converted = converted.replace(/^## (.*?)$/gm, '$1');
    converted = converted.replace(/^# (.*?)$/gm, '$1');
    
    // Handle bold and italic
    converted = converted.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold to plain text
    converted = converted.replace(/\*(.*?)\*/g, '$1'); // Italic to plain text
    
    // Handle lists
    converted = converted.replace(/^- (.*?)$/gm, '• $1');
    converted = converted.replace(/^\d+\. (.*?)$/gm, '$1');
    
    // Handle code blocks
    converted = converted.replace(/```.*?\n([\s\S]*?)```/g, '$1');
    converted = converted.replace(/`(.*?)`/g, '$1');
    
    // Handle links
    converted = converted.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');
    
    return converted;
  };

  const handleCopy = () => {
    const formattedText = convertMarkdownForWord(text);
    
    // Use the Clipboard API to copy the text
    navigator.clipboard.writeText(formattedText).then(() => {
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