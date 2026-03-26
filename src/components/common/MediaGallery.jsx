"use client";
import React from 'react';
import { FileText, File as FileIcon, Image as ImageIcon, Video, ExternalLink, Download, FileSpreadsheet } from 'lucide-react';
import axiosInstance from '../../lib/axios';

/**
 * MediaGallery Component
 * Handles rendering of images, videos and document links (PDF, Excel, etc)
 */
const MediaGallery = ({ files = [], title = "Evidence / Designs" }) => {
  if (!files || files.length === 0) return null;

  const getFileIcon = (url) => {
    const ext = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon size={16} />;
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return <Video size={16} />;
    if (['pdf'].includes(ext)) return <FileText size={16} />;
    if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet size={16} />;
    return <FileIcon size={16} />;
  };

  const isImage = (url) => {
    const ext = url.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const isVideo = (url) => {
    const ext = url.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
  };

  const resolveUrl = (url) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    
    // Get backend base URL (remove /api/v1)
    let apiBase = axiosInstance.defaults.baseURL || "";
    
    // If apiBase is relative or missing, fallback to current origin
    if (!apiBase.startsWith('http') && typeof window !== 'undefined') {
       apiBase = window.location.origin + (apiBase.startsWith('/') ? apiBase : '/' + apiBase);
    }
    
    const serverBase = apiBase.replace('/api/v1', '').replace(/\/$/, '');
    
    // Ensure url starts with /
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return encodeURI(`${serverBase}${cleanUrl}`);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {files.map((file, idx) => {
          const url = resolveUrl(file);
          const icon = getFileIcon(file);
          
          if (isImage(file)) {
            return (
              <div key={idx} className="group relative aspect-video rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer">
                <img 
                  src={url} 
                  alt={`Media ${idx + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/600x400?text=Load+Error";
                  }}
                />
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink size={20} className="text-white" />
                </a>
              </div>
            );
          }

          if (isVideo(file)) {
            return (
              <div key={idx} className="group relative aspect-video rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <video src={url} className="w-full h-full object-cover" controls />
              </div>
            );
          }

          // Document type
          return (
            <div key={idx} className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-all group relative">
               <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                  {React.cloneElement(icon, { size: 32 })}
               </div>
               <p className="text-[9px] font-bold text-gray-500 mt-2 px-2 text-center truncate w-full">
                 {file.split('/').pop()}
               </p>
               <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-[1px]"
                >
                  <Download size={16} className="text-blue-600" />
                </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MediaGallery;
