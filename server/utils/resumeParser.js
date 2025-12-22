const fs = require('fs');
const path = require('path');

/**
 * Resume Parser (Simplified version for KARVIA)
 * PDF parsing disabled for now - can be re-enabled with compatible library
 */

async function getResumeText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // For PDF files, return placeholder (PDF parsing requires additional setup)
  if (ext === '.pdf') {
    console.log('[Resume Parser] PDF parsing not available - upload as text file');
    return '[PDF content - please upload as .txt file for now]';
  }

  // For text files, read directly
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('Resume read error:', err);
    return '';
  }
}

module.exports = { getResumeText };
