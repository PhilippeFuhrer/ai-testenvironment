import React from 'react';
import { ClipboardIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false);

  // Convert markdown to a format better suited for Word
  const convertMarkdownForWord = (text: string): string => {
    let lines = text.split('\n');
    let converted = [];
    let inTable = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Check if this is a table row
      if (line.startsWith('|') && line.endsWith('|')) {
        // Skip separator rows (those with dashes and pipes)
        if (line.match(/^\|[\s-:|]+\|$/)) {
          continue;
        }
        
        // Process table row - remove outer pipes and replace inner pipes with tabs
        const cells = line
          .substring(1, line.length - 1) // Remove outer pipes
          .split('|')
          .map(cell => cell.trim());
        
        converted.push(cells.join('\t'));
        inTable = true;
      } else {
        if (inTable) {
          // Add an empty line after a table
          converted.push('');
          inTable = false;
        }
        
        // Process non-table content
        if (line.length > 0) {
          let processedLine = line
            // Handle headings
            .replace(/^### (.*?)$/, '$1')
            .replace(/^## (.*?)$/, '$1')
            .replace(/^# (.*?)$/, '$1')
            
            // Handle bold and italic - preserve Word formatting
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            
            // Handle lists
            .replace(/^- (.*?)$/, '• $1')
            .replace(/^\d+\. (.*?)$/, '$1')
            
            // Handle links
            .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');
          
          converted.push(processedLine);
        } else {
          // Preserve empty lines
          converted.push('');
        }
      }
    }
    
    // Join all processed lines back together
    let result = converted.join('\n');
    
    // Handle code blocks
    result = result.replace(/```.*?\n([\s\S]*?)```/g, '$1')
                   .replace(/`(.*?)`/g, '$1');
    
    return result;
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