/**
 * Footer Component
 * 
 * Displays a footer with Codebell branding
 * 
 * @module components/layout/Footer
 */

import codebellLogo from '../../assets/logo.png';

/**
 * Footer component with Codebell logo
 * @returns {JSX.Element} Footer component
 */
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-3 px-6">
      <div className="max-w-7xl mx-auto flex justify-end items-center">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Powered by</span>
          <img 
            src={codebellLogo} 
            alt="Codebell" 
            className="h-6 opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </footer>
  );
}

export default Footer;
